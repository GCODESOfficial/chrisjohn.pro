"use client";
import Image from 'next/image';
import Link from 'next/link';
import HeroSection from './components/HeroSection';
import Meet from './components/meet';
import WaysHelp from './components/WaysHelp';
import WhatPeopleSay from './components/WhatPeopleSay';
import Voice from './components/voice';

const images = ["/images/brands.svg"];


const Home = () => {
  return (
    <div className='font-[Lato]'>
      <HeroSection />

      <div className="w-11/12 h-[600px] mx-auto mt-16 rounded-2xl">
					<video
						src="/placeholdervideo.mp4"
						width={150}
						height={150}
						autoPlay
						muted
						loop
						playsInline
						className="w-full h-[600px] rounded-2xl object-cover"
					/>
				</div>

        <Meet />


        {/* Logos */}
					<div className="flex  items-center justify-center gap-6 md:mt-28 mt-12">
						<div className="relative overflow-hidden w-full">
							<div className="flex animate-scroll-x min-w-max">
								{[...images, ...images, ...images, ...images, ...images].map(
									(src, i) => {
										return (
											<div key={i} className="mr-8 flex items-center">
												<Image
													src={src}
													alt={`Scrolling Image ${i + 1}`}
													width={900} // Custom width for AWS
													height={600} // Custom height for AWS
													className=""
												/>
											</div>
										);
									}
								)}
							</div>
						</div>
					</div>

          <WaysHelp />

          <WhatPeopleSay />
          <Voice />
    </div>
  )
}

export default Home