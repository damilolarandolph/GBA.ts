import MemoryBlock from "../memory/memory-block";


enum INTERRUPTS {
    VBLANK,
    HBLANK,
    COUNTERMATCH,
    TIMER_0_OVERFLOW,
    TIMER_1_OVERFLOW,
    TIMER_2_OVERFLOW,
    TIMER_3_OVERFLOW,
    SERIAL,
    DMA_0,
    DMA_1,
    DMA_2,
    DMA_3,
    KEYPAD,
    GAMEPAK
}


export default class InterruptManager implements MemoryBlock {







}