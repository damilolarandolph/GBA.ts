import { BGCNT, Dimension, GPURegisters, Window } from "./VideoUnitRegisters";
import { BGLayers } from "./video-controller";


@unmanaged export class CompositionPixel {
    colour: u16 = 0;
    priority: u8 = 0;
}

export class CompositionMixer {
    BG0: StaticArray<CompositionPixel> = new StaticArray(240);
    BG1: StaticArray<CompositionPixel> = new StaticArray(240);
    BG2: StaticArray<CompositionPixel> = new StaticArray(240);
    BG3: StaticArray<CompositionPixel> = new StaticArray(240);
    OBJ: StaticArray<CompositionPixel> = new StaticArray(240);
    objWindowDimensions: Dimension = { rightX: 0, leftX: 0, topY: 0, bottomY: 0 };


    flushLines(): void {
        memory.fill(changetype<usize>(this.BG0), 0, sizeof<CompositionPixel>());
        memory.fill(changetype<usize>(this.BG1), 0, sizeof<CompositionPixel>());
        memory.fill(changetype<usize>(this.BG2), 0, sizeof<CompositionPixel>());
        memory.fill(changetype<usize>(this.BG3), 0, sizeof<CompositionPixel>());
        memory.fill(changetype<usize>(this.OBJ), 0, sizeof<CompositionPixel>());
    }
    mix(
        out: usize,
        gpuRegs: GPURegisters,
        layerMin: BGLayers,
        layerMax: BGLayers
    ): void {


        for (let index = 0; index < 240; ++index) {
            let topLayer: BGLayers = -1;
            let topCompPixel: CompositionPixel | null = null;
            let spritePixel = load<CompositionPixel>(changetype<usize>(this.OBJ) + (sizeof<CompositionPixel>() * index));
            let window: Window | null = null;
            let currentLine = gpuRegs.ly;

            if (gpuRegs.window0Enable && this.intersects(index, currentLine, gpuRegs.win0.dimensions)) {
                window = gpuRegs.win0;
            } else if (gpuRegs.window1Enable && this.intersects(index, currentLine, gpuRegs.win1.dimensions)) {
                window = gpuRegs.win1;
            } else if (gpuRegs.objWindowEnable && this.intersects(index, currentLine, this.objWindowDimensions)) {
                window = gpuRegs.objWin;
            } else if (gpuRegs.window0Enable || gpuRegs.window1Enable || gpuRegs.objWindowEnable) {
                window = gpuRegs.winOut;
            }


            for (let layerIndex = layerMin; layerIndex <= layerMax; ++layerIndex) {

                let newTop = load<CompositionPixel>(this.BGBuffer(layerIndex) + (sizeof<CompositionPixel>() * index));

                if (window != null &&
                    ((layerIndex == 0 && (!gpuRegs.bg0Enable || !window.bg0Enable))
                        || (layerIndex == 1 && (!gpuRegs.bg1Enable || !window.bg1Enable))
                        || (layerIndex == 2 && (!gpuRegs.bg2Enable || !window.bg2Enable))
                        || (layerIndex == 3 && (!gpuRegs.bg3Enable || !window.bg3Enable)))
                ) {
                    continue;
                }

                let bg: BGCNT;

                if (layerIndex == 0)
                    bg = gpuRegs.bg0;
                else if (layerIndex == 1)
                    bg = gpuRegs.bg1
                else if (layerIndex == 2)
                    bg = gpuRegs.bg2
                else if (layerIndex == 3)
                    bg = gpuRegs.bg3


                if (topCompPixel) {
                    if (topCompPixel.colour == 0 || topCompPixel.priority > newTop.priority) {
                        topCompPixel = newTop;
                        topLayer = layerIndex;
                    }
                } else {
                    topCompPixel = newTop;
                    topLayer = layerIndex;
                }
            }

            // Can no pixel be found ? 
            store<u16>(out + index, topCompPixel ? topCompPixel.colour : 0);
        }
    }



    @inline
    private intersects(x: u32, y: u32, dimension: Dimension): boolean {
        return (x >= dimension.leftX && x <= dimension.rightX) && (y >= dimension.topY && y <= dimension.bottomY);
    }

    BGBuffer(layer: BGLayers): usize {
        switch (layer) {
            case BGLayers.BG_0:
                return changetype<usize>(this.BG0);
            case BGLayers.BG_1:
                return changetype<usize>(this.BG1);
            case BGLayers.BG_2:
                return changetype<usize>(this.BG2);
            default:
                return changetype<usize>(this.BG3);
        }
    }
}
