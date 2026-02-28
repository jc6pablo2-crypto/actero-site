"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
    return (
        <div className="flex flex-col overflow-hidden pb-[500px] pt-[100px]">
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className="text-4xl font-semibold text-black dark:text-white">
                            Libérez la puissance des <br />
                            <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                                Animations au Défilement
                            </span>
                        </h1>
                    </>
                }
            >
                <img
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                    alt="hero"
                    className="mx-auto rounded-2xl object-cover h-full object-left-top w-full"
                    draggable={false}
                />
            </ContainerScroll>
        </div>
    );
}
