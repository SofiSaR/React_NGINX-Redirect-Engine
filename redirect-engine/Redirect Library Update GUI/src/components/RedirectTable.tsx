import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import useMeasure from 'react-use-measure';
import './RedirectTable.css';

const API_URL = 'http://127.0.0.1:5001/api/redirects';

const ITEM_SIZE = 50;
const FALLBACK_HEIGHT = window.innerHeight - 77;
const FALLBACK_WIDTH = window.innerWidth - 8;

type Entry = {
  request_url: string;
  redirect_url: string;
};

type Props = {
    requestFilter: string;
    redirectFilter: string;
};

export interface RedirectTableHandle {
    scrollToRow: (index: number) => void;
    fetchEntries: () => void;
}

const RedirectInfiniteTable = forwardRef<RedirectTableHandle, Props>(({ requestFilter, redirectFilter }, ref) => {
    const [measureRef, { height, width }] = useMeasure();
    const listRef = useRef<any>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [initRequestURL, setInitRequestUrl] = useState<string>('');

    let hasNextPage = false;

    const filteredEntries = entries.filter(entry =>
        entry.request_url.toLowerCase().includes(requestFilter.toLowerCase()) && entry.redirect_url.toLowerCase().includes(redirectFilter.toLowerCase())
    );

    const itemCount = hasNextPage ? filteredEntries.length + 1 : filteredEntries.length;

    const requestInputRef = useRef<HTMLInputElement>(null);
    const redirectInputRef = useRef<HTMLInputElement>(null);

    const isItemLoaded = (index: number) => !hasNextPage || index < filteredEntries.length;

    useImperativeHandle(ref, () => ({
        scrollToRow,
        fetchEntries,
    }));

    useEffect(() => {
        fetchEntries();
    }, []);

    const loadMore = () => {
        fetchEntries();
    };

    const fetchEntries = async () => {
        try {
            const res = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setEntries(data);
        }
        catch (e) {
            alert('Failed to fetch entries.');
        }
    };

    const scrollToRow = (index: number) => {
        if (listRef.current) {
            listRef.current.scrollToItem(index, 'center'); // 'auto', 'smart', 'center', or 'start'
        }
    };

    const handleEditClick = (index: number, initial_url: string) => {
        setEditIndex(index);
        setInitRequestUrl(initial_url)
    };

    const handleDeleteClick = async (index: number, request_url: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmed) return;
        try {
            let result;
            if (filteredEntries.length == entries.length) {
                result = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete',
                        index: index + 1,
                    }),
                });
            }
            else {
                result = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete',
                        request_url: request_url
                    }),
                });
            }
            const resultJSON = await result.json();
            if (!resultJSON.success) {
                alert(resultJSON.message);
                return;
            }
            fetchEntries();
            if (resultJSON.index > 0)
                scrollToRow(resultJSON.index);
        } catch {
            alert('Failed to delete entry. Please try again later.');
        }
    }

    const handleSaveClick = async (index: number) => {
        const confirmed = window.confirm("Are you sure you want to change this entry?");
        if (!confirmed) return;
        try {
            let result;
            if (filteredEntries.length == entries.length) {
                result = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update',
                        index: index + 1,
                        request_url: requestInputRef.current!.value,
                        redirect_url: redirectInputRef.current!.value,
                    }),
                });
            }
            else {
                result = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update',
                        init_request_url: initRequestURL,
                        request_url: requestInputRef.current!.value,
                        redirect_url: redirectInputRef.current!.value,
                    }),
                });
            }
            const resultJSON = await result.json();
            if (!resultJSON.success) {
                alert(resultJSON.message);
                return;
            }
            setEditIndex(null);
            fetchEntries();
            if (resultJSON.index > 0)
                scrollToRow(resultJSON.index);
        } catch {
            alert('Failed to save change. Please try again later.');
        }
    }

    const handleCancelClick = () => {
        setEditIndex(null);
    };

    return (
        <div ref={measureRef} style={{ flex: 1, width: '100%', height: '100%'}}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <InfiniteLoader
                    isItemLoaded={isItemLoaded}
                    itemCount={itemCount}
                    loadMoreItems={loadMore}
                >
                {({ onItemsRendered, ref }) => (
                    <List
                        className="RedirectTable"
                        height={height-2 || FALLBACK_HEIGHT}
                        itemCount={itemCount}
                        itemSize={ITEM_SIZE}
                        width={width-2 || FALLBACK_WIDTH}
                        onItemsRendered={onItemsRendered}
                        ref={node => {
                            listRef.current = node;
                            if (typeof ref === 'function') ref(node);
                            else if (ref) (ref as React.MutableRefObject<any>).current = node;
                        }}
                        style={{ overflowY: 'auto' }}
                    >
                    {({ index, style }) =>
                        isItemLoaded(index) ? (
                            editIndex === index ? (
                                <div className="row" style={{ ...style }}>
                                    <div className="cell">{index + 1}</div>
                                    <input ref={requestInputRef} className="cell" type="text" name="request_url" defaultValue={filteredEntries[index].request_url} />
                                    <input ref={redirectInputRef} className="cell" type="text" name="redirect_url" defaultValue={filteredEntries[index].redirect_url} />
                                    <button className="cell add-save" onClick={() => handleSaveClick(index + 1)}>Save</button>
                                    <button className="cell cancel" onClick={handleCancelClick}>Cancel</button>
                                </div>
                            )
                            : (
                                <div className="row" style={{ ...style }}>
                                    <div className="cell">{index + 1}</div>
                                    <div className="cell">{filteredEntries[index].request_url}</div>
                                    <div className="cell">{filteredEntries[index].redirect_url}</div>
                                    <button className="cell" onClick={() => handleEditClick(index, filteredEntries[index].request_url)}>Edit</button>
                                    <button className="cell" onClick={() => handleDeleteClick(index + 1, filteredEntries[index].request_url)}>Delete</button>
                                </div>
                            )
                        )
                        : (
                            <div style={style}>Loading...</div>
                        )
                    }
                    </List>
                )}
                </InfiniteLoader>
            </div>
        </div>
    );
});

export default RedirectInfiniteTable;