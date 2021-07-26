import './App.css';
import React, { useRef } from 'react';
import { Screen } from './screen';
import ClientEmulatorBridge from './gba-worker/client';
const App = () => {
    const [gba, setGBA] = React.useState(null);
    const { canvas, ref } = useCanvas();

    React.useEffect(() => {
        const gba = new ClientEmulatorBridge();
        setGBA(gba);
    }, []);

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
            gba.run();
        }} />
        <Screen />
    </div>
};


function useCanvas() {
    let ref = useRef();
    return {
        canvas: <canvas ref={ref} style={{ width: '240px', height: '160px' }}>

        </canvas>, ref
    }
}

export default App;
