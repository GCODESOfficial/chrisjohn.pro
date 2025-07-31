// app/works/page.tsx
import ProjectsSection from "../components/ProjectsSection";
import WhatPeopleSay from "../components/WhatPeopleSay";

export default function WorksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <ProjectsSection />
      <div className="py-32">
   <WhatPeopleSay />
      </div>
   
    </main>
  );
}
