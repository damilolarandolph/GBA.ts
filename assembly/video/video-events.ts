import { Event, Scheduler } from "../scheduler";
import { VideoController } from "./video-controller";

export namespace VideoEvents {
    export let HBLANK: VideoEvent;
    export let HBLANK_END: VideoEvent;
    export const HBLANK_HANDLER: VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => {
        controller.hblank(s, tardiness);
    }
    export const HBLANK_END_HANDLER: VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => {
        controller.hblankEnd(s, tardiness);
    }
}



export type VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => void;

export class VideoEvent extends Event {

    private controller: VideoController;
    private handler: VideoEventHandler;

    constructor(videoUnit: VideoController, handler: VideoEventHandler) {
        super();
        this.controller = videoUnit;
        this.handler = handler;
    }
    run(scheduler: Scheduler, tardiness: u64): void {
        this.handler(scheduler, tardiness, this.controller);
    }
}


