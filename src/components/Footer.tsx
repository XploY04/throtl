function PixelMountainLeftWhite() {
  return (
    <>
      <div className="absolute h-10 w-10 -top-10 bg-white"></div>
      <div className="absolute h-5 w-5 -top-15 bg-white"></div>
      <div className="absolute h-5 w-5 -top-5 left-10 bg-white"></div>
    </>
  );
}
function PixelMountainLeftBlack() {
  return (
    <>
      <div className="absolute h-10 w-10 top-0 bg-neutral-950"></div>
      <div className="absolute h-5 w-5 top-10 bg-neutral-950"></div>
      <div className="absolute h-5 w-5 top-0 left-10 bg-neutral-950"></div>
    </>
  );
}
function PixelMountainRightWhite() {
  return (
    <>
      <div className="absolute h-10 w-10 -top-10 right-0 bg-white"></div>
      <div className="absolute h-5 w-5 -top-15 right-0 bg-white"></div>
      <div className="absolute h-5 w-5 -top-5 right-10 bg-white"></div>
    </>
  );
}
function PixelMountainRightBlack() {
  return (
    <>
      <div className="absolute right-0 h-10 w-10 top-0 bg-neutral-950"></div>
      <div className="absolute right-0 h-5 w-5 top-10 bg-neutral-950"></div>
      <div className="absolute right-10 h-5 w-5 top-0 bg-neutral-950"></div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="relative py-8 text-sm text-neutral-950 font-bold bg-white">
      <PixelMountainLeftWhite />
      <PixelMountainLeftBlack />
      <PixelMountainRightWhite />
      <PixelMountainRightBlack />
      {/* --- THIS IS THE UPDATED DIV --- */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div>© {new Date().getFullYear()} Throtl</div>
        <div className="flex items-center gap-4">
          <a className="hover:underline" href="#">
            Privacy
          </a>
          <a className="hover:underline" href="#">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}