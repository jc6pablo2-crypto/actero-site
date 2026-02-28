"use client";

import React from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import { Activity, Box, Cloud, Database, Globe, Hexagon, Wifi, Command } from "lucide-react";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "../ui/carousel";

interface Logo {
    id: string;
    description: string;
    icon: React.ReactNode;
    className?: string;
}

interface Logos3Props {
    heading?: string;
    logos?: Logo[];
    className?: string;
}

const Logos3 = ({
    heading = "Approuvé par ces entreprises",
    logos = [
        {
            id: "logo-1",
            description: "Logo 1",
            icon: <Activity className="h-7 w-auto" />,
        },
        {
            id: "logo-2",
            description: "Logo 2",
            icon: <Box className="h-7 w-auto" />,
        },
        {
            id: "logo-3",
            description: "Logo 3",
            icon: <Cloud className="h-7 w-auto" />,
        },
        {
            id: "logo-4",
            description: "Logo 4",
            icon: <Database className="h-7 w-auto" />,
        },
        {
            id: "logo-5",
            description: "Logo 5",
            icon: <Globe className="h-7 w-auto" />,
        },
        {
            id: "logo-6",
            description: "Logo 6",
            icon: <Hexagon className="h-7 w-auto" />,
        },
        {
            id: "logo-7",
            description: "Logo 7",
            icon: <Wifi className="h-7 w-auto" />,
        },
        {
            id: "logo-8",
            description: "Logo 8",
            icon: <Command className="h-7 w-auto" />,
        },
    ],
}: Logos3Props) => {
    return (
        <section className="py-64">
            <div className="container flex flex-col items-center text-center">
                <h1 className="my-6 text-2xl font-bold text-pretty lg:text-4xl">
                    {heading}
                </h1>
            </div>
            <div className="pt-10 md:pt-16 lg:pt-20">
                <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
                    <Carousel
                        opts={{ loop: true }}
                        plugins={[AutoScroll({ playOnInit: true })]}
                    >
                        <CarouselContent className="ml-0">
                            {logos.map((logo) => (
                                <CarouselItem
                                    key={logo.id}
                                    className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                                >
                                    <div className="mx-10 flex shrink-0 items-center justify-center">
                                        <div>
                                            {logo.icon}
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
                </div>
            </div>
        </section>
    );
};

export { Logos3 };
