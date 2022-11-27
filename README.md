# cron-tabit-scraper

App for scraping data from tabit (a website to reserve places in Israeli restaurants)
The app gets a timeslot & organization id which represents the restaurant, both currently hardcoded, and sends a request every minute to check availability
If the slot is available, it notifies via email
