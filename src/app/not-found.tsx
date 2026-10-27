import { redirect } from "next/navigation";
import error404 from "../../public/error404.gif";
import Image from "next/image";
import Link from "next/link";
export default function notFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <Image src={error404} alt="404 Not Found" className="w-1/2 mb-4" />
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}