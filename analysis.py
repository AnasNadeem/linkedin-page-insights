import requests
import json
import pandas as pd
from datetime import datetime

# -------------------------------------------------------------------------
# PART 1: FETCH DATA
# -------------------------------------------------------------------------
def fetch_buffer_data():
    """
    Fetches data from Buffer API using the headers/cookies from the curl command.
    Note: Session cookies (buffer_session) expire quickly. You may need to update
    the headers dictionary with fresh values from your browser network tab.
    """
    url = 'https://graph.buffer.com/?_o=GetPostList'
    
    # Headers derived from your curl command
    headers = {
        'accept': '*/*',
        'content-type': 'application/json',
        'x-buffer-client-id': 'webapp-publishing',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        # INSTRUCTION: If fetching fails, update the 'cookie' string below with a fresh one from your browser
        'cookie': 'buffer-signup=...; buffer_session=...; (Paste full cookie string here from curl)' 
    }

    # The GraphQL payload
    payload = {
        "operationName": "GetPostList",
        "variables": {
            "first": 50, # Increased limit to get more data for analysis
            "after": None,
            "organizationId": "692db129b784def30b617fb3",
            "status": ["sent", "sending"],
            "channelIds": ["692db31729ea336fd6432f80"],
            "sort": [{"field": "dueAt", "direction": "desc"}, {"field": "createdAt", "direction": "desc"}]
        },
        "query": """
        query GetPostList($first: Int!, $after: String, $organizationId: OrganizationId!, $channelIds: [ChannelId!], $tagIds: [TagId!], $status: [PostStatus!], $sort: [PostSortInput!]) {
          posts(
            input: {organizationId: $organizationId, filter: {channelIds: $channelIds, tagIds: $tagIds, status: $status}, sort: $sort}
            first: $first
            after: $after
          ) {
            edges {
              node {
                id
                sentAt
                text
                metrics {
                  type
                  value
                }
                channel {
                  name
                  service
                }
              }
            }
          }
        }
        """
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

# -------------------------------------------------------------------------
# PART 2: ANALYSE DATA
# -------------------------------------------------------------------------
def analyze_buffer_data(json_data):
    if not json_data or 'data' not in json_data:
        print("Invalid JSON data provided.")
        return

    posts_list = []
    
    # 1. Parse the nested GraphQL structure
    edges = json_data.get('data', {}).get('posts', {}).get('edges', [])
    
    for edge in edges:
        node = edge['node']
        
        # Extract timestamp
        sent_at_str = node.get('sentAt')
        if not sent_at_str:
            continue
            
        sent_dt = datetime.fromisoformat(sent_at_str.replace('Z', '+00:00'))
        
        # Extract Metrics (Convert list of dicts to a single dict)
        metrics_list = node.get('metrics', [])
        metrics = {m['type']: (m['value'] if m['value'] is not None else 0) for m in metrics_list}
        
        # Calculate Total Engagement (Reactions + Comments + Shares)
        total_engagement = metrics.get('reactions', 0) + metrics.get('comments', 0) + metrics.get('shares', 0)
        
        posts_list.append({
            'id': node.get('id'),
            'date': sent_dt.date(),
            'day_of_week': sent_dt.strftime('%A'),
            'hour_of_day': sent_dt.hour,
            'text': node.get('text', '')[:100] + "...", # Truncate for display
            'impressions': metrics.get('impressions', 0),
            'reactions': metrics.get('reactions', 0),
            'comments': metrics.get('comments', 0),
            'engagement': total_engagement
        })

    # Create DataFrame
    df = pd.DataFrame(posts_list)
    
    if df.empty:
        print("No posts found to analyze.")
        return

    print("="*60)
    print(f"ANALYSIS SUMMARY ({len(df)} Posts)")
    print("="*60)

    # --- A. Top Performing Posts ---
    print("\n🏆 TOP 3 POSTS BY IMPRESSIONS:")
    top_impressions = df.sort_values(by='impressions', ascending=False).head(3)
    for i, row in top_impressions.iterrows():
        print(f"  {i+1}. [{row['date']}] {row['impressions']} Impr | {row['engagement']} Eng | Text: {row['text']}")

    print("\n🔥 TOP 3 POSTS BY ENGAGEMENT (Reactions + Comments):")
    top_engagement = df.sort_values(by='engagement', ascending=False).head(3)
    for i, row in top_engagement.iterrows():
        print(f"  {i+1}. [{row['date']}] {row['engagement']} Eng | {row['impressions']} Impr | Text: {row['text']}")

    # --- B. Timing Analysis ---
    # Group by Hour
    hourly_avg = df.groupby('hour_of_day')[['impressions', 'engagement']].mean()
    best_hour = hourly_avg['engagement'].idxmax()
    
    print("\n⏰ BEST TIME TO POST (Avg Engagement):")
    print(f"  Best Hour (UTC): {best_hour}:00")
    print("  Hourly Performance:")
    print(hourly_avg.sort_values(by='engagement', ascending=False).head(5))

    # Group by Day
    daily_avg = df.groupby('day_of_week')[['impressions', 'engagement']].mean()
    # Sort by custom order if needed, but simple sort works for finding top
    best_day = daily_avg['engagement'].idxmax()

    print("\nPv🗓️ BEST DAY TO POST:")
    print(f"  Best Day: {best_day}")
    print("  Daily Performance:")
    print(daily_avg.sort_values(by='engagement', ascending=False))

# -------------------------------------------------------------------------
# EXECUTION
# -------------------------------------------------------------------------
# Option 1: Load from the file you provided (Recommended for testing)
# You can save your JSON content to 'fleetzz_data.json'
try:
    with open('fleetzz_data.json', 'r') as f:
        local_data = json.load(f)
    print("Running analysis on local file...")
    analyze_buffer_data(local_data)
except FileNotFoundError:
    print("Local file not found. Set up the fetch_buffer_data headers to query the API.")
    # Option 2: Fetch fresh data (Requires valid cookies in headers)
    # api_data = fetch_buffer_data()
    # analyze_buffer_data(api_data)