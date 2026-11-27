# Namma Tamil Nadu - Corporation Complaint Portal

## Run in VS Code
1. Extract `Namma_Tamil_Nadu_Project.zip`.
2. Open the extracted folder in Visual Studio Code.
3. Install the **Live Server** extension (if it is not already installed).
4. Right-click `index.html` and choose **Open with Live Server**.

Keep `index.html`, `style.css`, `script.js`, and the `assets` folder together.

## Header images
Put `tnmap.png` and `Chief MInister.jpg` inside the `assets` folder. If they are missing, the Chennai photo is used on the left and the Chief Minister photo is hidden.

## Browser storage (db.js)
`db.js` holds the localStorage code shared by the public site (index.html) and the officer page (officer.html).
It is loaded before script.js and officer.js. Open both pages from the SAME Live Server address, e.g. http://127.0.0.1:5500/index.html and http://127.0.0.1:5500/officer.html

## Officer portal
Open `officer.html` (or use "Government staff login" in the public footer).
Demo logins: officer1 / tn@2026, officer2 / tn@2026, admin / admin@2026.

## Images included
- Three Tamil Nadu images are used in the login and home-page slideshow.
- Seven civic-service photos are shown in the public issue gallery: road repair, drainage, garbage, streetlight, water leakage, traffic signal, and electricity.

## Important
This is a front-end demonstration. Login, registration, and complaint records use browser `localStorage`; complaint status is set by the officer page. It is not connected to a real Corporation server, and complaints are not sent to a government department.
