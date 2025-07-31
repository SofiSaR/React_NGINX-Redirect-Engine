# NGINX Redirect Engine

## Introduction

This **NGINX Redirect Engine** project provides a functional starting point for a redirect pipeline to streamline organizational management of redirects.

## Main Components

- **NGINX Executable**  
  Used to start a local NGINX server.  
  *Located at:* `nginx.exe`

- **NGINX Config File**  
  Configures NGINX to send requests to the redirect pipeline.  
  *Located at:* `conf/nginx.conf`

- **Excel File for Redirect Storage**  
  Stores redirects in alphabetical order.  
  *Located at:* `redirect-engine/RedirectLibrary.xlsx`  
  *Note:* The Excel file's Redirect Library sheet should be deleted to start the Redirect Library Update GUI program with a blank set of data. After this, the Excel file should only be edited via the Redirect Library Update GUI program.

- **Python Flask-based Pipeline**  
  Called by `nginx.conf` to find the redirect URL corresponding to a given request URL from the Excel file and redirect the user.  
  *Located at:* `redirect-engine/redirect-engine.py`

- **React Application**  
  Allows adding, updating, or deleting `requestURL` ↔ `redirectURL` pairs from/to the Excel file.  
  *Located at:* `redirect-engine/Redirect Library Update GUI/`

- **Python Flask-based Backend for React App**  
  Supports redirect updating for the React application.  
  *Located at:* `redirect-engine/Redirect Library Update GUI/backend/redirects-update-service.py`

## Why an Excel File?

This project uses an Excel file instead of a database to minimize administrative overhead and provide ease of access for management. Text and CSV files were considered but are inefficient for direct row access. Databases like Redis were ruled out due to their cache-based nature and lack of persistent storage for thousands of records. Other databases (BerkeleyDB, LevelDB, SQL) do not maintain alphabetical order on insert and offer similar search time complexity ($$O(\log n)$$) as an Excel file. Thus, Excel offers the intended balance between performance and usability.

## Time Complexity of Operations

- **Sorting Entries:** N/A (alphabetic order maintained)
- **Searching for a redirect URL given the request URL, or vice versa:** $$O(\log n)$$
- **Updating an entry (given the index of the entry from the GUI):** $$O(1)$$
- **Updating an entry from data that has been filtered (iven the request URL of the entry from the GUI):** $$O(\log n)$$
- **Deleting an entry (given the index of the entry from the GUI):** $$O(1)$$
- **Deleting an entry from data that has been filtered (iven the request URL of the entry from the GUI):** $$O(\log n)$$
- **Adding an entry:** $$O(\log n)$$

## How to Run the Redirect Library Management Service

### 1. Start the Backend for Handling Redirect Updates from the React GUI

- Open a PowerShell terminal.
- Navigate to: `redirect-engine/Redirect Library Update GUI/backend/`
- Run the backend:
  ```
  python .\redirects-update-service.py
  ```
- Installing the bcrypt library for checking password validity may be required:
  ```
  pip install bcrypt
  ```
- The backend's functions can be accessed by the frontend via requests to API endpoints:
  - [`http://127.0.0.1:5001/api/redirects`](http://127.0.0.1:5001/api/redirects)
  - [`http://127.0.0.1:5001/api/login`](http://127.0.0.1:5001/api/login)
- The backend's address can be altered later to accommodate an organizational environment.

### 2. Start the React GUI for Managing Redirects

- Open a new terminal (keep the backend terminal open).
- Navigate to: `redirect-engine/Redirect Library Update GUI/`
- Install dependencies:
  ```
  npm install
  ```
- If needed, install additional packages:
  ```
  npm install react-window
  npm install react-window-infinite-loader
  ```
- Start the React application:
  ```
  npm run
  ```
- Access the GUI at [http://localhost:5173](http://localhost:5173).

Now, a user who visits the URL [http://localhost:5173](http://localhost:5173) and logs in with username "admin" and password "password" will be able to edit the Excel data.

## How to Run the Pipeline for Redirecting Requests

### 1. Start the NGINX Server

- In the base directory containing `nginx.exe`, open a PowerShell terminal.
- Start NGINX:
  ```
  start nginx
  ```
- To stop NGINX if desired later (don't stop it while you want to pipeline to be working):
  ```
  .\nginx -s stop
  ```
- NGINX will now handle requests to URLs starting with [`http://localhost:8080/`](http://localhost:8080/) by sending the request to the redirect pipeline.

### 2. Start the Python Flask Redirect Pipeline

- With NGINX running, open another terminal.
- Navigate to: `redirect-engine/`
- Start the redirect pipeline:
  ```
  python .\redirect-engine.py
  ```
- The pipeline should now be available to the NGINX server at address [`http://127.0.0.1:5000/`](http://127.0.0.1:5000/).

Now, any user that enters a URL such as [`http://localhost:8080/site0100`](http://localhost:8080/site0100) in their browser, for example, will be redirected to the redirect URL corresponding to the request URL [`http://localhost/site0100`](http://localhost/site0100) in the Excel file.


*Note:* Both the redirect pipeline and the redirect management program's backend assume that the Excel file is in the parent directory redirect-engine that they are both in. I would recommend similarly collocating these programs with the Excel file in an organizational environment due to their interdependence. If they are on separate containers or nodes, any references to the Excel file in redirect-engine.py and redirect-update-service.py will need to be updated.