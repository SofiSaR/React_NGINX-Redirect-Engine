import React, { useState, useRef } from 'react';
import RedirectTable, { type RedirectTableHandle } from './components/RedirectTable';
import LoginModal from './components/LoginModal';
import './App.css';

const REDIRECT_API_URL = 'http://127.0.0.1:5001/api/redirects';
const LOGIN_API_URL = 'http://127.0.0.1:5001/api/login';

function App() {
    const redirectTableRef = useRef<RedirectTableHandle>(null);

    const [addActive, setAddActive] = useState<boolean>(false);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
    const [searchRequestQuery, setRequestSearchQuery] = useState<string>('');
    const [searchRedirectQuery, setRedirectSearchQuery] = useState<string>('');
    const [addValue, setAddValue] = useState<{ request_url: string; redirect_url: string }>({ request_url: '', redirect_url: '' });

    const handleRequestSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRequestSearchQuery(e.target.value);
    };

    const handleRedirectSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRedirectSearchQuery(e.target.value);
    };

    const handleAddARedirectClick = () => {
        setAddActive(true);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddValue({ ...addValue, [e.target.name]: e.target.value });
    };

    const handleCancelClick = () => {
        setAddActive(false);
    }

    const handleAddClick = async () => {
        const confirmed = window.confirm("Are you sure you want to add this entry?");
        if (!confirmed) return;
        try {
            const result = await fetch(REDIRECT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    request_url: addValue.request_url,
                    redirect_url: addValue.redirect_url
                }),
            });
            const resultJSON = await result.json();
            if (!resultJSON.success) {
                alert(resultJSON.message);
                if (resultJSON.index > 0)
                    redirectTableRef.current?.scrollToRow(resultJSON.index);
                return;
            }
            setAddActive(false);
            redirectTableRef.current?.fetchEntries();
            if (resultJSON.index > 0)
                redirectTableRef.current?.scrollToRow(resultJSON.index);
        } catch {
            alert('Failed to add entry. Please try again later.');
        }
    }

    const handleLogin = async (username: string, password: string) => {
        try {
            const result = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
            });
            const resultJSON = await result.json();
            if (!resultJSON.success) {
                alert(resultJSON.message);
                return;
            }
            setLoggedIn(true);
            setShowLoginModal(false);
        }
        catch {
            alert('Failed to log in. Please try again later.');
        }
    };

    return (
        <div id="redirects-page">
            <header>
                <h1>Redirect Library</h1>
                {
                    loggedIn ? (
                        <button onClick={() => setLoggedIn(false)}>Logout</button>
                    )
                    : (
                        <button onClick={() => setShowLoginModal(true)}>Login</button>
                    )
                }
            </header>
            <main>
                {
                    loggedIn ? (
                        <div className="main-page">
                            <div className="search-inputs">
                                <h3>Search by:</h3>
                                <input
                                    type="text"
                                    placeholder="Search by Request URL..."
                                    value={searchRequestQuery}
                                    onChange={handleRequestSearchChange}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by Redirect URL..."
                                    value={searchRedirectQuery}
                                    onChange={handleRedirectSearchChange}
                                />
                            </div>
                            <div className="box">
                                <div className="table-header">
                                    <h3>Index</h3>
                                    <h3>Request URL</h3>
                                    <h3>Redirect URL</h3>
                                    <h3>Edit</h3>
                                    <h3>Delete</h3>
                                </div>
                                <RedirectTable ref={redirectTableRef} requestFilter={searchRequestQuery} redirectFilter={searchRedirectQuery}/>
                                {
                                    addActive ? (
                                        <div className="add-section">
                                            <input className="cell" type="text" name="request_url" onChange={handleInputChange} />
                                            <input className="cell" type="text" name="redirect_url" onChange={handleInputChange} />
                                            <button className="cell add-save" onClick={handleAddClick}>Add</button>
                                            <button className="cell cancel" onClick={handleCancelClick}>Cancel</button>
                                        </div>
                                    )
                                    : (
                                        <button className="add-redirect" onClick={handleAddARedirectClick}>Add a Redirect</button>
                                    )
                                }
                            </div>
                        </div>
                    )
                    : (
                        <p>You are not logged in. You must be logged in to access the redirect library.</p>
                    )
                }
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
            </main>
        </div>
    );
}

export default App;
