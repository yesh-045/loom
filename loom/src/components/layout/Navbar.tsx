"use client"

import { useSession } from "@/components/SessionProvider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface NavbarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {

  return (
    <nav className="bg-card text-foreground border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold items-center space-x-1 flex flex-row">
              <span className="sr-only">Home</span>
              <Image className="rounded-full hidden md:block" src={"/logo.png"} alt="" width={35} height={35} />
              <span className="font-heading tracking-tight text-taupe-500 hover:text-melon-600 transition-colors">loom</span>
            </Link>
            {(isSidebarOpen !== undefined && setIsSidebarOpen !== undefined) &&
              <Button
                className="block ml-3 z-50 md:hidden bg-primary text-primary-foreground hover:bg-accent"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                Chat History
              </Button>
            }
          </div>
          <div className="">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function AuthButton() {
  const { data: session } = useSession()
  const router = useRouter()
  
  if (session) {
    return (
      <>
        <Image className="rounded-full hidden md:block" src={"/default-profile.jpg"} alt="" width={35} height={35} />
        <Button 
          className="rounded-full bg-primary text-primary-foreground hover:bg-accent mx-2 md:m-0" 
          onClick={() => router.push('/auth/signin')}
        >
          Sign out
        </Button>
      </>
    )
  }

  return (
    <>
      <Button 
        className="rounded-full bg-primary text-primary-foreground hover:bg-accent" 
        onClick={() => router.push('/auth/signin')}
      >
        Sign in
      </Button>
    </>
  )
}