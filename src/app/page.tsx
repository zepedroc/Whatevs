import NavBar from '@/components/navbar';

export default function Home() {
  return (
    <>
      <NavBar />
      <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">Hello there!</div>
    </>
  );
}
