import svgPaths from "./svg-aw32wk0on4";
const imgAvatar = "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=128";

function Settings() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Settings">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Settings">
          <path d={svgPaths.p2deac700} id="Vector" stroke="var(--stroke-0, #FAFAFA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="bg-[#2563eb] content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[32px]" data-name="icon">
      <Settings />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative whitespace-pre-wrap" data-name="Text">
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#171717] text-[14px] w-full" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        AGELGIL
      </p>
      <p className="font-['DM_Sans:Light',sans-serif] font-light leading-[16px] relative shrink-0 text-[#737373] text-[12px] w-full" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Workspace
      </p>
    </div>
  );
}

function DropdownIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Dropdown Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Dropdown Icon">
          <path d={svgPaths.p15233480} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Collapsible() {
  return (
    <div className="relative rounded-[6px] shrink-0 w-full" data-name="Collapsible">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <Icon />
          <Text />
          <DropdownIcon />
        </div>
      </div>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="bg-white h-[68px] relative rounded-[2px] shrink-0 w-full" data-name="Sidebar header">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col items-center p-[8px] relative size-full">
          <Collapsible />
        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Settings Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Settings Icon">
          <g id="Vector">
            <path d={svgPaths.pff0fc00} stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p1d76d410} stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p2f091200} stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p39897300} stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Dashboard
      </p>
    </div>
  );
}

function ListItem() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <SettingsIcon />
          <Text1 />
        </div>
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="h-[40px] relative rounded-[2px] shrink-0 w-full" data-name="Section">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[8px] relative size-full">
          <ListItem />
        </div>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[32px] opacity-70 relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[8px] relative size-full">
          <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#404040] text-[12px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            Pages
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Settings Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Settings Icon">
          <path d={svgPaths.p31a85300} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Contacts
      </p>
    </div>
  );
}

function ListItem1() {
  return (
    <div className="relative rounded-[2px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[8px] py-[10px] relative w-full">
          <SettingsIcon1 />
          <Text3 />
        </div>
      </div>
    </div>
  );
}

function ModelsIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Models Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Models Icon">
          <path d={svgPaths.p3489d4f0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-white w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Message
      </p>
    </div>
  );
}

function BadgesForBlocks() {
  return (
    <div className="bg-[rgba(255,255,255,0.15)] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[2px] relative rounded-[9999px] shrink-0 w-[24px]" data-name="Badges for blocks">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">35</p>
      </div>
    </div>
  );
}

function ListItem2() {
  return (
    <div className="bg-[#2563eb] h-[40px] relative rounded-[2px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[8px] py-[10px] relative size-full">
          <ModelsIcon />
          <Text4 />
          <BadgesForBlocks />
        </div>
      </div>
    </div>
  );
}

function DocumentationIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Icon">
          <path d={svgPaths.p321dac00} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Users
      </p>
    </div>
  );
}

function ListItem3() {
  return (
    <div className="relative rounded-[2px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[8px] py-[10px] relative w-full">
          <DocumentationIcon />
          <Text5 />
        </div>
      </div>
    </div>
  );
}

function DocumentationIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Icon">
          <path d={svgPaths.p3c1a0b80} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Setting
      </p>
    </div>
  );
}

function ListItem4() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[8px] py-[10px] relative w-full">
          <DocumentationIcon1 />
          <Text6 />
        </div>
      </div>
    </div>
  );
}

function ModelsIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Models Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Models Icon">
          <path d={svgPaths.p2db15c80} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Milestones
      </p>
    </div>
  );
}

function ListItem5() {
  return (
    <div className="opacity-0 relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <ModelsIcon1 />
          <Text7 />
        </div>
      </div>
    </div>
  );
}

function DocumentationIcon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Icon">
          <path d={svgPaths.p1e2f1b00} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Design Assets
      </p>
    </div>
  );
}

function DocumentationArrow() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Arrow">
          <path d="M6 12L10 8L6 4" id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ListItem6() {
  return (
    <div className="opacity-0 relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <DocumentationIcon2 />
          <Text8 />
          <DocumentationArrow />
        </div>
      </div>
    </div>
  );
}

function DocumentationIcon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Icon">
          <path d={svgPaths.p3998da00} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Campaign calendar
      </p>
    </div>
  );
}

function SoftBadge() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[9999px] shrink-0" data-name="Soft Badge" style={{ backgroundImage: "linear-gradient(90deg, rgba(23, 23, 23, 0.1) 0%, rgba(23, 23, 23, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#06b6d4] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">3</p>
      </div>
    </div>
  );
}

function ListItem7() {
  return (
    <div className="opacity-0 relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <DocumentationIcon3 />
          <Text9 />
          <SoftBadge />
        </div>
      </div>
    </div>
  );
}

function DocumentationIcon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Icon">
          <path d={svgPaths.p156f40c0} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#404040] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Ad performance
      </p>
    </div>
  );
}

function DocumentationArrow1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Documentation Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Documentation Arrow">
          <path d="M6 12L10 8L6 4" id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ListItem8() {
  return (
    <div className="opacity-0 relative rounded-[8px] shrink-0 w-full" data-name="List Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <DocumentationIcon4 />
          <Text10 />
          <DocumentationArrow1 />
        </div>
      </div>
    </div>
  );
}

function InnerItems() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="inner  Items">
      <ListItem1 />
      <ListItem2 />
      <ListItem3 />
      <ListItem4 />
      <ListItem5 />
      <ListItem6 />
      <ListItem7 />
      <ListItem8 />
    </div>
  );
}

function PlatformSection() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Platform Section">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Text2 />
        <InnerItems />
      </div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="flex-[1_0_0] grid-cols-[max-content] grid-rows-[max-content] h-full inline-grid leading-[0] min-h-px min-w-px place-items-start relative" data-name="Progress bar">
      <div className="bg-[rgba(23,23,23,0.2)] col-1 h-[8px] ml-0 mt-0 rounded-[9999px] row-1 w-[200px]" data-name="Opacity" />
      <div className="bg-[#2563eb] col-1 h-[8px] ml-0 mt-0 rounded-bl-[9999px] rounded-tl-[9999px] row-1 w-[100px]" data-name="progress-bar" />
    </div>
  );
}

function Progress1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px relative w-full" data-name="Progress">
      <ProgressBar />
    </div>
  );
}

function Progress() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-[200px]" data-name="Progress">
      <Progress1 />
    </div>
  );
}

function SolidButton() {
  return (
    <div className="bg-[#06b6d4] relative rounded-[8px] shrink-0 w-full" data-name="Solid Button">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[6px] items-center justify-center px-[12px] py-[6px] relative w-full">
          <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#fafafa] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">See All Plans</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start p-[16px] relative w-full">
          <p className="font-['DM_Sans:SemiBold',sans-serif] font-semibold leading-[28px] relative shrink-0 text-[#404040] text-[20px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            Upgrade Your Plan
          </p>
          <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-full relative shrink-0 text-[#404040] text-[14px] w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            Your trial plan ends in 12 days. Upgrade your plan and unlock full potential!
          </p>
          <Progress />
          <SolidButton />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Plus() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="plus">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="plus">
          <path d={svgPaths.p36bdefc0} id="Vector" stroke="var(--stroke-0, #2563EB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SoftButton() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Soft Button" style={{ backgroundImage: "linear-gradient(90deg, rgba(23, 23, 23, 0.1) 0%, rgba(23, 23, 23, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative w-full">
          <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#06b6d4] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Add new workspace</p>
          </div>
          <Plus />
        </div>
      </div>
    </div>
  );
}

function CardContainer() {
  return (
    <div className="opacity-0 relative shrink-0 w-full" data-name="Card container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start p-[12px] relative w-full">
          <Card />
          <SoftButton />
        </div>
      </div>
    </div>
  );
}

function SidebarContent() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px min-w-px relative w-full" data-name="Sidebar content">
      <Section />
      <PlatformSection />
      <CardContainer />
    </div>
  );
}

function Sidebar1() {
  return (
    <div className="bg-[#fafafa] flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="Sidebar">
      <div className="content-stretch flex flex-col gap-[32px] items-start p-[16px] relative size-full">
        <SidebarHeader />
        <SidebarContent />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-[1024px] items-center min-h-px min-w-px relative" data-name="Sidebar">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-r border-solid inset-[0_-1px_0_0] pointer-events-none" />
      <Sidebar1 />
    </div>
  );
}

function PlaygroundArrow() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Playground Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Playground Arrow">
          <path d={svgPaths.p1f85aff0} id="Vector" stroke="var(--stroke-0, #404040)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ShadcnStudioLogo() {
  return (
    <div className="content-stretch flex gap-[12px] h-[32px] items-center relative shrink-0" data-name="shadcn-studio-logo">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[26px] not-italic relative shrink-0 text-[#737373] text-[20px]">Turumba</p>
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Logo">
      <ShadcnStudioLogo />
    </div>
  );
}

function Row() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="row">
      <PlaygroundArrow />
      <div className="flex h-[16px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "153.5" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[16px]" data-name="line">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 1">
                <line id="line" stroke="var(--stroke-0, #E5E5E5)" x2="16" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Logo />
    </div>
  );
}

function DefaultInput() {
  return <div className="content-stretch flex flex-col items-start shrink-0" data-name="Default Input" />;
}

function LeftIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left-icon">
          <path d={svgPaths.p1fe39070} id="Vector" stroke="var(--stroke-0, #2563EB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function GhostIconButton() {
  return (
    <div className="content-stretch flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0" data-name="Ghost Icon Button">
      <LeftIcon />
    </div>
  );
}

function LeftIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_194_9754)" id="Left-icon">
          <path d={svgPaths.p34227c00} id="Vector" stroke="var(--stroke-0, #2563EB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_194_9754">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function GhostIconButton1() {
  return (
    <div className="content-stretch flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0" data-name="Ghost Icon Button">
      <LeftIcon1 />
    </div>
  );
}

function Mask() {
  return (
    <div className="h-[12px] relative shrink-0 w-[8px]" data-name="Mask">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 12">
        <g id="Mask">
          <circle cx="4" cy="6" fill="var(--fill-0, #DC2626)" id="Ellipse 1" r="4" />
        </g>
      </svg>
    </div>
  );
}

function DotBadge() {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center justify-center left-[19px] px-[4px] rounded-[9999px] top-0" data-name="Dot Badge">
      <Mask />
    </div>
  );
}

function Actions() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Actions">
      <GhostIconButton />
      <GhostIconButton1 />
      <DotBadge />
    </div>
  );
}

function Avatar() {
  return (
    <div className="overflow-clip relative rounded-[2px] shrink-0 size-[38px]" data-name="Avatar">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgAvatar} />
    </div>
  );
}

function FlexVertical() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0" data-name="Flex vertical">
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Eyosiyas Ketema
      </p>
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Admin
      </p>
    </div>
  );
}

function User() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="User">
      <Avatar />
      <FlexVertical />
    </div>
  );
}

function Row1() {
  return (
    <div className="content-stretch flex gap-[24px] items-center justify-end relative shrink-0" data-name="Row">
      <Actions />
      <User />
    </div>
  );
}

function Navbar() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Navbar">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-l border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[24px] py-[16px] relative w-full">
          <Row />
          <DefaultInput />
          <Row1 />
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-name="Container">
      <p className="font-['DM_Sans:SemiBold',sans-serif] font-semibold leading-[28px] relative shrink-0 text-[18px] text-black" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Group Message
      </p>
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#737373] text-[16px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Manage and track your group messaging activities.
      </p>
    </div>
  );
}

function LeftIcon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left-icon">
          <path d={svgPaths.pc982d00} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#fafafa] h-[40px] relative rounded-[2px] shrink-0 w-full" data-name="input">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[12px] py-[6px] relative size-full">
          <LeftIcon2 />
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Regular',sans-serif] font-normal h-[26px] justify-center leading-[0] min-h-px min-w-px overflow-hidden relative text-[#737373] text-[14px] text-ellipsis whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] overflow-hidden">Search Messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultInput1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[358px]" data-name="Default Input">
      <Input />
    </div>
  );
}

function LeftIcon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left-icon">
          <path d={svgPaths.p6353f00} id="Vector" stroke="var(--stroke-0, #FAFAFA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton1() {
  return (
    <div className="bg-[#2563eb] content-stretch flex gap-[8px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[2px] shrink-0" data-name="Solid Button">
      <LeftIcon3 />
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#fafafa] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">New Group Message</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <DefaultInput1 />
      <SolidButton1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Container6 />
    </div>
  );
}

function LeftIcon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="left-icon">
          <path d={svgPaths.p3489d4f0} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BadgesForBlocks1() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[2px] relative rounded-[9999px] shrink-0 w-[24px]" data-name="Badges for blocks">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">35</p>
      </div>
    </div>
  );
}

function Tab3() {
  return (
    <div className="content-stretch flex gap-[6px] h-[32px] items-center justify-center overflow-clip px-[10px] py-[5px] relative rounded-[2px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 z-[5]" data-name="Tab 8">
      <LeftIcon4 />
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Messages
      </p>
      <BadgesForBlocks1 />
    </div>
  );
}

function LeftIcon5() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_194_9730)" id="left-icon">
          <path d={svgPaths.p85aa380} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_194_9730">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Tab4() {
  return (
    <div className="content-stretch flex gap-[6px] h-[32px] items-center justify-center px-[10px] py-[6px] relative rounded-[10px] shrink-0 z-[4]" data-name="Tab 02">
      <LeftIcon5 />
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Conversation
      </p>
    </div>
  );
}

function LeftIcon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="left-icon">
          <path d={svgPaths.p6353f00} id="Vector" stroke="var(--stroke-0, #2563EB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BadgesForBlocks2() {
  return (
    <div className="bg-[rgba(37,99,235,0.15)] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[2px] relative rounded-[9999px] shrink-0 w-[24px]" data-name="Badges for blocks">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#2563eb] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">4</p>
      </div>
    </div>
  );
}

function Tab2() {
  return (
    <div className="bg-white content-stretch flex gap-[6px] h-[32px] items-center justify-center overflow-clip px-[10px] py-[5px] relative rounded-[2px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 z-[3]" data-name="Tab 7">
      <LeftIcon6 />
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Group Messaging
      </p>
      <BadgesForBlocks2 />
    </div>
  );
}

function LeftIcon7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_194_9716)" id="left-icon">
          <path d={svgPaths.p34bf9b80} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_194_9716">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function BadgesForBlocks3() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[2px] relative rounded-[9999px] shrink-0 w-[24px]" data-name="Badges for blocks">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">4</p>
      </div>
    </div>
  );
}

function Tab1() {
  return (
    <div className="content-stretch flex gap-[6px] h-[32px] items-center justify-center overflow-clip px-[10px] py-[5px] relative rounded-[2px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 z-[2]" data-name="Tab 6">
      <LeftIcon7 />
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Scheduled
      </p>
      <BadgesForBlocks3 />
    </div>
  );
}

function LeftIcon8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="left-icon">
          <path d={svgPaths.pe5fd080} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BadgesForBlocks4() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[2px] relative rounded-[9999px] shrink-0 w-[24px]" data-name="Badges for blocks">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">8</p>
      </div>
    </div>
  );
}

function Tab() {
  return (
    <div className="content-stretch flex gap-[6px] h-[32px] items-center justify-center overflow-clip px-[10px] py-[5px] relative rounded-[2px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 z-[1]" data-name="Tab 5">
      <LeftIcon8 />
      <p className="font-['DM_Sans:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Templates
      </p>
      <BadgesForBlocks4 />
    </div>
  );
}

function AdvanceTabs() {
  return (
    <div className="bg-[#f5f5f5] content-center flex flex-wrap gap-0 h-[40px] isolate items-center overflow-clip p-[4px] relative rounded-[2px] shrink-0" data-name="Advance Tabs">
      <Tab3 />
      <Tab4 />
      <Tab2 />
      <Tab1 />
      <Tab />
    </div>
  );
}

function RightIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Right-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Right-icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton2() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0" data-name="Solid Button">
      <div className="content-stretch flex gap-[6px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[inherit]">
        <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
          <p className="leading-[20px]">All Channels</p>
        </div>
        <RightIcon />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function RightIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Right-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Right-icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton3() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0" data-name="Solid Button">
      <div className="content-stretch flex gap-[6px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[inherit]">
        <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
          <p className="leading-[20px]">All Groups</p>
        </div>
        <RightIcon1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function LeftIcon9() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left-icon">
          <path d={svgPaths.p1f2b7e00} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton4() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0" data-name="Solid Button">
      <div className="content-stretch flex gap-[6px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[inherit]">
        <LeftIcon9 />
        <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
          <p className="leading-[20px]">dd/mm/yyyy</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function LeftIcon10() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left-icon">
          <path d={svgPaths.p1f2b7e00} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton5() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0" data-name="Solid Button">
      <div className="content-stretch flex gap-[6px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[inherit]">
        <LeftIcon10 />
        <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
          <p className="leading-[20px]">dd/mm/yyyy</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function RightIcon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Right-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Right-icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SolidButton6() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0" data-name="Solid Button">
      <div className="content-stretch flex gap-[6px] items-center overflow-clip pl-[20px] pr-[24px] py-[10px] relative rounded-[inherit]">
        <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
          <p className="leading-[20px]">Newest First</p>
        </div>
        <RightIcon2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
      <SolidButton2 />
      <SolidButton3 />
      <div className="flex h-[30px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "153.5" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[30px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 1">
                <line id="Line 10" stroke="var(--stroke-0, #E5E5E5)" x2="30" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <SolidButton4 />
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">To</p>
      </div>
      <SolidButton5 />
      <div className="flex h-[30px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "153.5" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[30px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 1">
                <line id="Line 10" stroke="var(--stroke-0, #E5E5E5)" x2="30" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <SolidButton6 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <Frame />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white relative rounded-[2px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[rgba(244,244,245,0.6)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="content-stretch flex flex-col gap-[8px] items-start p-[16px] relative w-full">
        <AdvanceTabs />
        <Frame2 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[8px] items-start pt-[32px] px-[24px] relative w-full">
        <Container5 />
        <Frame1 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container4 />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox />
    </div>
  );
}

function Row5Checkbox() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox />
    </div>
  );
}

function Checkbox1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox1 />
    </div>
  );
}

function Row5Checkbox1() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox1 />
    </div>
  );
}

function Checkbox2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox2() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox2 />
    </div>
  );
}

function Row5Checkbox2() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox2 />
    </div>
  );
}

function Checkbox3() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox3() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox3 />
    </div>
  );
}

function Row5Checkbox3() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox3 />
    </div>
  );
}

function Checkbox4() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox4() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox4 />
    </div>
  );
}

function Row5Checkbox4() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox4 />
    </div>
  );
}

function Checkbox5() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox5() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox5 />
    </div>
  );
}

function Row5Checkbox5() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox5 />
    </div>
  );
}

function Checkbox6() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox6() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox6 />
    </div>
  );
}

function Row5Checkbox6() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox6 />
    </div>
  );
}

function Checkbox7() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox7() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox7 />
    </div>
  );
}

function Row5Checkbox7() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox7 />
    </div>
  );
}

function Checkbox8() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox8() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox8 />
    </div>
  );
}

function Row5Checkbox8() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox8 />
    </div>
  );
}

function Checkbox9() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox9() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox9 />
    </div>
  );
}

function Row5Checkbox9() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <CheckBox9 />
    </div>
  );
}

function Checkbox10() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[4px] shrink-0 size-[16px]" data-name="Checkbox">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function CheckBox10() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Check Box">
      <Checkbox10 />
    </div>
  );
}

function Row5Checkbox10() {
  return (
    <div className="content-stretch flex h-[56px] items-center justify-center relative shrink-0 w-[49px]" data-name="Row 5 Checkbox">
      <CheckBox10 />
    </div>
  );
}

function CheckboxColumn() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[49px]" data-name="Checkbox Column">
      <Row5Checkbox />
      <Row5Checkbox1 />
      <Row5Checkbox2 />
      <Row5Checkbox3 />
      <Row5Checkbox4 />
      <Row5Checkbox5 />
      <Row5Checkbox6 />
      <Row5Checkbox7 />
      <Row5Checkbox8 />
      <Row5Checkbox9 />
      <Row5Checkbox10 />
    </div>
  );
}

function RoleContainer() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">MESSAGE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleRow() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 01">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow5() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 24">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow7() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 26">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow6() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 25">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow8() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 27">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow3() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 22">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow9() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 28">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow2() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 21">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow4() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 23">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleRow1() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Role row 20">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[0] p-[8px] relative size-full text-[#0a0a0a] whitespace-nowrap">
          <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Message Title</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[16px]">Reminder: Your subscription renews...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function RoleColumn() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[256px]" data-name="Role Column">
      <RoleContainer />
      <RoleRow />
      <RoleRow5 />
      <RoleRow7 />
      <RoleRow6 />
      <RoleRow8 />
      <RoleRow3 />
      <RoleRow9 />
      <RoleRow2 />
      <RoleRow4 />
      <RoleRow1 />
    </div>
  );
}

function StatusContainer() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">CHANNEL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoftBadge1() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Whatsapp</p>
      </div>
    </div>
  );
}

function StatusRow5() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 01">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge1 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge2() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Whatsapp</p>
      </div>
    </div>
  );
}

function StatusRow12() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 13">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge2 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge3() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">SMS</p>
      </div>
    </div>
  );
}

function StatusRow13() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 14">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge3 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge4() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">SMS</p>
      </div>
    </div>
  );
}

function StatusRow14() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 15">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge4 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge5() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Telegram</p>
      </div>
    </div>
  );
}

function StatusRow15() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 16">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge5 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge6() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Whatsapp</p>
      </div>
    </div>
  );
}

function StatusRow18() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 19">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge6 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge7() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Telegram</p>
      </div>
    </div>
  );
}

function StatusRow20() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 21">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge7 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge8() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">SMS</p>
      </div>
    </div>
  );
}

function StatusRow17() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 18">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge8 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge9() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">SMS</p>
      </div>
    </div>
  );
}

function StatusRow19() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 20">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge9 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge10() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">SMS</p>
      </div>
    </div>
  );
}

function StatusRow16() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 17">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge10 />
        </div>
      </div>
    </div>
  );
}

function StatusColumn() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[102px]" data-name="Status Column">
      <StatusContainer />
      <StatusRow5 />
      <StatusRow12 />
      <StatusRow13 />
      <StatusRow14 />
      <StatusRow15 />
      <StatusRow18 />
      <StatusRow20 />
      <StatusRow17 />
      <StatusRow19 />
      <StatusRow16 />
    </div>
  );
}

function StatusContainer1() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">STATUS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoftBadge11() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Sent</p>
      </div>
    </div>
  );
}

function StatusRow() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 01">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge11 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge12() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge" style={{ backgroundImage: "linear-gradient(90deg, rgba(227, 146, 25, 0.1) 0%, rgba(227, 146, 25, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#d97706] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Scheduled</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <SoftBadge12 />
    </div>
  );
}

function StatusRow6() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 02">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge13() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge" style={{ backgroundImage: "linear-gradient(90deg, rgba(1, 82, 203, 0.1) 0%, rgba(1, 82, 203, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0152cb] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Delivered</p>
      </div>
    </div>
  );
}

function StatusRow7() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 03">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge13 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge14() {
  return (
    <div className="bg-[rgba(224,52,52,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#df2224] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Failed</p>
      </div>
    </div>
  );
}

function StatusRow8() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 04">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge14 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge15() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Sent</p>
      </div>
    </div>
  );
}

function StatusRow10() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 11">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge15 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge16() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#111826] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Sent</p>
      </div>
    </div>
  );
}

function StatusRow21() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 15">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge16 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge17() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge" style={{ backgroundImage: "linear-gradient(90deg, rgba(1, 82, 203, 0.1) 0%, rgba(1, 82, 203, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0152cb] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Delivered</p>
      </div>
    </div>
  );
}

function StatusRow22() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 14">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge17 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge18() {
  return (
    <div className="bg-[rgba(224,52,52,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#df2224] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Failed</p>
      </div>
    </div>
  );
}

function StatusRow11() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 12">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge18 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge19() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge" style={{ backgroundImage: "linear-gradient(90deg, rgba(1, 82, 203, 0.1) 0%, rgba(1, 82, 203, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0152cb] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Delivered</p>
      </div>
    </div>
  );
}

function StatusRow23() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 13">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge19 />
        </div>
      </div>
    </div>
  );
}

function SoftBadge20() {
  return (
    <div className="bg-[rgba(224,52,52,0.1)] content-stretch flex gap-[2px] items-center justify-center px-[6px] py-[2px] relative rounded-[6px] shrink-0" data-name="Soft Badge">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#df2224] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">Failed</p>
      </div>
    </div>
  );
}

function StatusRow9() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 10">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <SoftBadge20 />
        </div>
      </div>
    </div>
  );
}

function StatusColumn1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[119px]" data-name="Status Column">
      <StatusContainer1 />
      <StatusRow />
      <StatusRow6 />
      <StatusRow7 />
      <StatusRow8 />
      <StatusRow10 />
      <StatusRow21 />
      <StatusRow22 />
      <StatusRow11 />
      <StatusRow23 />
      <StatusRow9 />
    </div>
  );
}

function StatusContainer2() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">TARGET</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow1() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 01">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] w-full" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">Newsletter Subscribers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow24() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 20">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] w-full" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">All Contacts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow25() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 21">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] w-full" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">All Contacts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow26() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 14">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">{`VIP `}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow27() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 17">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Leads</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow28() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 15">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Premium Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow29() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 10">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[20px] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="mb-0">NewsLetter</p>
            <p>Subscribers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow30() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 25">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Leads</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow31() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 24">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[20px] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="mb-0">NewsLetter</p>
            <p>Subscribers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow32() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 26">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Premium Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusColumn2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[125px]" data-name="Status Column">
      <StatusContainer2 />
      <StatusRow1 />
      <StatusRow24 />
      <StatusRow25 />
      <StatusRow26 />
      <StatusRow27 />
      <StatusRow28 />
      <StatusRow29 />
      <StatusRow30 />
      <StatusRow31 />
      <StatusRow32 />
    </div>
  );
}

function StatusContainer3() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">STAT(S/D/R/F)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame4 />
      <Frame5 />
      <Frame7 />
      <Frame8 />
    </div>
  );
}

function StatusRow2() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 01">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame10 />
      <Frame11 />
      <Frame12 />
      <Frame13 />
    </div>
  );
}

function StatusRow33() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 33">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame9 />
        </div>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame15 />
      <Frame16 />
      <Frame17 />
      <Frame18 />
    </div>
  );
}

function StatusRow34() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 32">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame14 />
        </div>
      </div>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame20 />
      <Frame21 />
      <Frame22 />
      <Frame23 />
    </div>
  );
}

function StatusRow35() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 34">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame19 />
        </div>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame25 />
      <Frame26 />
      <Frame27 />
      <Frame28 />
    </div>
  );
}

function StatusRow36() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 35">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame24 />
        </div>
      </div>
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame30 />
      <Frame31 />
      <Frame32 />
      <Frame33 />
    </div>
  );
}

function StatusRow37() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 30">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame29 />
        </div>
      </div>
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame35 />
      <Frame36 />
      <Frame37 />
      <Frame38 />
    </div>
  );
}

function StatusRow38() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 36">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame34 />
        </div>
      </div>
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame43() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame40 />
      <Frame41 />
      <Frame42 />
      <Frame43 />
    </div>
  );
}

function StatusRow39() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 29">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame39 />
        </div>
      </div>
    </div>
  );
}

function Frame45() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame46() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame47() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame48() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame45 />
      <Frame46 />
      <Frame47 />
      <Frame48 />
    </div>
  );
}

function StatusRow40() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 37">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame44 />
        </div>
      </div>
    </div>
  );
}

function Frame50() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">S</p>
      </div>
    </div>
  );
}

function Frame51() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#16a34a] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">D</p>
      </div>
    </div>
  );
}

function Frame52() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#2563eb] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">R</p>
      </div>
    </div>
  );
}

function Frame53() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start px-[8px] relative shrink-0">
      <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#dc2626] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">0</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#737373] text-[12px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[16px]">F</p>
      </div>
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center leading-[0] relative shrink-0 text-center w-full whitespace-nowrap">
      <Frame50 />
      <Frame51 />
      <Frame52 />
      <Frame53 />
    </div>
  );
}

function StatusRow41() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 31">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <Frame49 />
        </div>
      </div>
    </div>
  );
}

function StatusColumn3() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[174px]" data-name="Status Column">
      <StatusContainer3 />
      <StatusRow2 />
      <StatusRow33 />
      <StatusRow34 />
      <StatusRow35 />
      <StatusRow36 />
      <StatusRow37 />
      <StatusRow38 />
      <StatusRow39 />
      <StatusRow40 />
      <StatusRow41 />
    </div>
  );
}

function StatusContainer4() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">DATE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow3() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 01">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/11/26, 4:20 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow42() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 18">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/11/26, 4:20 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow4() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 7">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 10:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow43() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 14">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 10:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow44() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 17">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 10:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow45() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 15">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 10:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow46() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 10">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 3:45 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow47() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 19">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/11/26, 4:20 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow48() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 12">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/13/26, 9:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow49() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Status Row 16">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative size-full">
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">2/12/26, 10:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusColumn4() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[125px]" data-name="Status Column">
      <StatusContainer4 />
      <StatusRow3 />
      <StatusRow42 />
      <StatusRow4 />
      <StatusRow43 />
      <StatusRow44 />
      <StatusRow45 />
      <StatusRow46 />
      <StatusRow47 />
      <StatusRow48 />
      <StatusRow49 />
    </div>
  );
}

function ActionContainer() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['DM_Sans:Medium',sans-serif] font-medium h-full justify-center leading-[0] min-h-px min-w-px relative text-[#737373] text-[14px] text-center" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">Actions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon />
          <EllipsisIcon />
        </div>
      </div>
    </div>
  );
}

function EyeIcon1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p36489000} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow1() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon1 />
          <TrashIcon />
          <EllipsisIcon1 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow2() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon2 />
          <EllipsisIcon2 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p39743e40} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow3() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon3 />
          <TrashIcon1 />
          <EllipsisIcon3 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow4() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon4 />
          <EllipsisIcon4 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <path d={svgPaths.p1fd09e80} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function TrashIcon2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p36489000} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow5() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon5 />
          <TrashIcon2 />
          <EllipsisIcon5 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon6() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon6() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow6() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon6 />
          <EllipsisIcon6 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon7() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p39743e40} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon7() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow7() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon7 />
          <TrashIcon3 />
          <EllipsisIcon7 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon8() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p39743e40} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon8() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow8() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon8 />
          <TrashIcon4 />
          <EllipsisIcon8 />
        </div>
      </div>
    </div>
  );
}

function EyeIcon9() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Eye Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Eye Icon">
          <g id="Vector">
            <path d={svgPaths.pac54200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p254f3200} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Trash Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Trash Icon">
          <path d={svgPaths.p39743e40} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function EllipsisIcon9() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Ellipsis Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Ellipsis Icon">
          <path d={svgPaths.p3f642310} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ActionRow9() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Action Row">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end p-[8px] relative size-full">
          <EyeIcon9 />
          <TrashIcon5 />
          <EllipsisIcon9 />
        </div>
      </div>
    </div>
  );
}

function ActionColumn() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-[148px]" data-name="Action Column">
      <ActionContainer />
      <ActionRow />
      <ActionRow1 />
      <ActionRow2 />
      <ActionRow3 />
      <ActionRow4 />
      <ActionRow5 />
      <ActionRow6 />
      <ActionRow7 />
      <ActionRow8 />
      <ActionRow9 />
    </div>
  );
}

function TableContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Table Container">
      <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-[0_0_-1px_0] pointer-events-none" />
      <CheckboxColumn />
      <RoleColumn />
      <StatusColumn />
      <StatusColumn1 />
      <StatusColumn2 />
      <StatusColumn3 />
      <StatusColumn4 />
      <ActionColumn />
    </div>
  );
}

function RightIcon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Right-icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Right-icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white content-stretch flex gap-[6px] h-[36px] items-center px-[12px] py-[4px] relative rounded-[8px] shrink-0" data-name="input">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-[-1px] pointer-events-none rounded-[9px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] overflow-hidden relative shrink-0 text-[#0a0a0a] text-[14px] text-ellipsis whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">10</p>
      </div>
      <RightIcon3 />
    </div>
  );
}

function SelectPlan() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Select Plan">
      <Input1 />
    </div>
  );
}

function Number() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Number">
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#737373] text-[16px]" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        Show
      </p>
      <SelectPlan />
    </div>
  );
}

function LeftIcon11() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Left icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Left icon">
          <path d="M10 12L6 8L10 4" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SoftButton1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0" data-name="Soft Button">
      <LeftIcon11 />
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#2563eb] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">Previous</p>
      </div>
    </div>
  );
}

function SoftButton2() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[8px] items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" data-name="Soft Button">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">1</p>
      </div>
    </div>
  );
}

function SoftButton3() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" data-name="Soft Button">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">2</p>
      </div>
    </div>
  );
}

function SoftButton4() {
  return (
    <div className="bg-[#2563eb] content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" data-name="Soft Button">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#fafafa] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">3</p>
      </div>
    </div>
  );
}

function SoftButton5() {
  return (
    <div className="bg-[rgba(23,23,23,0.1)] content-stretch flex gap-[8px] items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" data-name="Soft Button">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">4</p>
      </div>
    </div>
  );
}

function RightIcon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Right icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Right icon">
          <path d="M6 12L10 8L6 4" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function SoftButton6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Soft Button">
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
        <p className="leading-[20px]">Next</p>
      </div>
      <RightIcon4 />
    </div>
  );
}

function PaginationVariants() {
  return (
    <div className="content-stretch flex gap-[4px] items-start relative shrink-0" data-name="Pagination Variants">
      <SoftButton1 />
      <SoftButton2 />
      <SoftButton3 />
      <SoftButton4 />
      <SoftButton5 />
      <SoftButton6 />
    </div>
  );
}

function FlexHorizontal() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Flex horizontal">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[24px] relative size-full">
          <Number />
          <div className="flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#737373] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "\'opsz\' 14" }}>
            <p className="leading-[20px]">Showing 1 to 5 of 25 entries</p>
          </div>
          <PaginationVariants />
        </div>
      </div>
    </div>
  );
}

function ProBlocksDatatableDatatableComponentDatatableComponent() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative rounded-[2px] shrink-0 w-[1100px]" data-name="pro-blocks/datatable/datatable-component/datatable-component-05">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <TableContainer />
      <FlexHorizontal />
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pb-[24px] pt-[16px] px-[24px] relative w-full">
          <ProBlocksDatatableDatatableComponentDatatableComponent />
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container9 />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[1158px]" data-name="Container">
      <Navbar />
      <Container2 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex items-start left-0 top-0 w-[1439px]" data-name="Container">
      <Sidebar />
      <Container1 />
    </div>
  );
}

export default function GroupMessage() {
  return (
    <div className="bg-white relative size-full" data-name="Group Message">
      <Container />
    </div>
  );
}