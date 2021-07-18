import { Dimension, VideoUnitRegisters } from "./VideoUnitRegisters";
import { BGLayers, WindowLayers } from "./video-controller";


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
        gpuRegs: VideoUnitRegisters,
        layerMin: BGLayers,
        layerMax: BGLayers
    ): void {

        let win0Dimensions = gpuRegs.windowRegs.getDimensions(WindowLayers.WINDOW_0);
        let win1Dimensions = gpuRegs.windowRegs.getDimensions(WindowLayers.WINDOW_1);
        let currentLine = gpuRegs.dispStatus.LY;
        for (let index = 0; index < 240; ++index) {
            let topLayer: BGLayers = -1;
            let topCompPixel: CompositionPixel | null = null;
            let spritePixel = load<CompositionPixel>(changetype<usize>(this.OBJ), sizeof<CompositionPixel>() * index);

            for (let layerIndex = layerMin; layerIndex <= layerMax; ++layerIndex) {

                let newTop = load<CompositionPixel>(this.BGBuffer(layerIndex), sizeof<CompositionPixel>() * index);

                if (!gpuRegs.displayControl.isDisplay(layerIndex)) {
                    continue;
                }

                if (gpuRegs.displayControl.isWindow(WindowLayers.WINDOW_0)) {
                    // TODO: Make this simpler
                    if (this.intersects(index, currentLine, win0Dimensions)
                        && !gpuRegs.windowRegs.windowBGEnable(WindowLayers.WINDOW_0, layerIndex)) {
                        continue;
                    }
                } else if (gpuRegs.displayControl.isWindow(WindowLayers.WINDOW_1)) {
                    if (this.intersects(index, currentLine, win1Dimensions)
                        && !gpuRegs.windowRegs.windowBGEnable(WindowLayers.WINDOW_1, layerIndex)) {
                        continue;
                    }
                } else if (gpuRegs.displayControl.isOBJWindow) {
                    if (this.intersects(index, currentLine, this.objWindowDimensions)
                        && !gpuRegs.windowRegs.windowBGEnableOut(true, layerIndex)
                    ) {
                        continue;
                    }
                } else if (!gpuRegs.windowRegs.windowBGEnableOut(false, layerIndex)) {
                    continue;
                }

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
    private intersects(x: u8, y: u8, dimension: Dimension): boolean {
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
