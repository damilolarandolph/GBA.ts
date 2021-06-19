import './App.css';

import React from 'react';
const App = React.memo(() => {
    const [worker, setWorker] = React.useState(null);

    React.useEffect(() => {
        const worker = new Worker(new URL('./worker.js', import.meta.url));
        setWorker(worker);
    }, []);

    return <input type="file" onChange={async (e) => {
        let file = e.target.files[0];
        let buffer = await file.arrayBuffer();
        let arry = new Uint8Array(buffer);
        worker.postMessage(arry);
    }} />
});

export default App;
