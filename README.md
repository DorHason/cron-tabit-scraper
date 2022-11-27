# cron-tabit-scraper

App for scraping data from tabit, a website to reserve places in Israeli restaurants<br /><br />
The app gets a timeslot & organization id which represents the restaurant (both are currently hardcoded) and sends a request every minute to check availability<br />
If the slot is available, it notifies via email
