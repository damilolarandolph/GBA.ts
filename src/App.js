import './App.css';
import React, { useRef, useState } from 'react';
import { Screen } from './screen';
import ClientEmulatorBridge from './gba-worker/client';
const App = () => {
    const [gba, setGBA] = React.useState(null);
    const { canvas, ref } = useCanvas();
    const [isPaused, setPaused] = useState(true);

    React.useEffect(() => {
        const gba = new ClientEmulatorBridge();
        gba.renderer.canvas = ref.current;
        setGBA(gba);
    }, []);

    const pauseOrPlay = () => {
        if (isPaused) {
            gba.run();
        } else {
            gba.pause();
        }
        setPaused(!isPaused);
    }

    // React.useEffect(() => {
    //     if (gba != null)
    //         gba.renderer.canvas = ref;
    // }, [canvas, ref, gba])



    return <div>
        {canvas}
        <input type="file" onChange={async (e) => {
            let file = e.target.files[0];
            let buffer = await file.arrayBuffer();
            let arry = new Uint8Array(buffer);
            gba.loadRom(arry)
        }} />

        <button onClick={pauseOrPlay}> {isPaused ? 'Play' : 'Pause'}</button>
    </div>
};


function useCanvas() {
    let ref = useRef();
    return {
        canvas: <canvas ref={ref} style={{ width: `${240 * 3}px`, height: `${160 * 3}px` }}>

        </canvas>, ref
    }
}

export default App;
