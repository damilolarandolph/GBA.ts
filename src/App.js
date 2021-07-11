import './App.css';

import React from 'react';
import GBA from './gba-worker/client';
const App = React.memo(() => {
    const [gba, setGBA] = React.useState(null);

    React.useEffect(() => {
        const gba = new GBA();
        gba.bootWorker();
        setGBA(gba);
    }, []);

    return <input type="file" onChange={async (e) => {
        let file = e.target.files[0];
        let buffer = await file.arrayBuffer();
        let arry = new Uint8Array(buffer);
        gba.gbaWorker.loadRom(arry)
    }} />
});

export default App;
