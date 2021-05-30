import { ARM7CPU } from "../../cpu";
import { testCondition } from "../instructions";


export function SWI(cpu: ARM7CPU): void {
    if (cpu.instructionStage == 0) {
        if (!testCondition(cpu)) { }
    }
    //TODO implement interrupts
}