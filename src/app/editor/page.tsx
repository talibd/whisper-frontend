import React from "react";
import SegmentCard from "@/components/editor/SegmentCard";
import VideoCard from "@/components/editor/VideoCard";
import SegmentSetting from "@/components/editor/SegmentSetting";
import {Button} from "@/components/ui/button";
import ExportButton from "@/components/editor/ExportButton";
import SegmentStyle from "@/components/editor/SegmentStyle";
import MyColorPicker from "@/components/editor/MyColorPicker";
import SuggestionBox from "@/components/editor/SuggestionBox";

function page() {
  return (
    <div className="grid grid-cols-9 grid-rows-5 bg-neutral-900 min-h-screen">
      {/* content side bar  */}
      <div className="col-span-2 row-span-5 bg-neutral-800 border-r border-neutral-700 ">
        <h1 className="text-2xl text-white pt-3 px-4">Layers</h1>
        <hr className="my-4 border-neutral-700" />
        <div className="px-3">
        <SegmentCard />
        </div>
      </div>
      <div className="col-span-5 row-span-5 col-start-3 flex items-center justify-center">
        <VideoCard />
      </div>
      <div className="col-span-2 row-span-5 flex flex-col   col-start-8 p-3">
       <ExportButton />
        <div className=" mt-5">
          <SegmentSetting  />
          <SegmentStyle/>
        </div>
          <SuggestionBox/>
      </div>
    </div>
  );
}

export default page;
