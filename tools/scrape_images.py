import mysql.connector
from ddgs import DDGS
import time
import sys

def scrape_and_update():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="reserve-hub"
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, name, location FROM restaurants")
        restaurants = cursor.fetchall()
        
        print(f"Found {len(restaurants)} restaurants to update.")
        
        ddgs = DDGS()
        
        for restaurant in restaurants:
            res_id = restaurant['id']
            name = restaurant['name']
            location = restaurant['location']
            
            query = f"{name} {location} restaurant food"
            print(f"Searching for [{res_id}]: {query}...")
            
            try:
                # Get max 3 results, take the first one
                results = ddgs.images(query, max_results=3)
                if results:
                    img_url = results[0]['image']
                    
                    # Update database
                    cursor.execute(
                        "UPDATE restaurants SET image_url = %s WHERE id = %s",
                        (img_url, res_id)
                    )
                    conn.commit()
                    print(f"  -> Updated with: {img_url}")
                else:
                    print("  -> No images found.")
            except Exception as e:
                print(f"  -> Error fetching image: {e}")
            
            # Sleep to prevent getting rate limited
            time.sleep(1.5)
            
        cursor.close()
        conn.close()
        print("Done updating all restaurants!")
        
    except Exception as e:
        print(f"Database or script error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    scrape_and_update()
