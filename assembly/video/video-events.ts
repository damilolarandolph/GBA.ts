import { Event, Scheduler } from "../scheduler";
import { VideoController } from "./video-controller";
export class VideoEvent extends Event {

    public controller: VideoController | null = null;
    public handler: VideoEventHandler | null = null;

    run(scheduler: Scheduler, tardiness: u64): void {
        (this.handler as VideoEventHandler)(scheduler, tardiness, (this.controller as VideoController));
    }
}
export namespace VideoEvents {
    export let HBLANK: VideoEvent = new VideoEvent();
    export let HBLANK_END: VideoEvent = new VideoEvent();
    export let VBLANK_END: VideoEvent = new VideoEvent();
    export const HBLANK_HANDLER: VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => {
        controller.hblank(s, tardiness);
    }
    export const HBLANK_END_HANDLER: VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => {
        controller.hblankEnd(s, tardiness);
    }

}



export type VideoEventHandler = (s: Scheduler, tardiness: u64, controller: VideoController) => void;




