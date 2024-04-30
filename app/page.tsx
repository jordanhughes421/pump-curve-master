import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between text-brandColor5 p-6 md:p-24">
    <header className="z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold">Welcome to the Next.js Auth Boilerplate</h1>
        <p className="text-md md:text-lg">
            This boilerplate simplifies the process of building a Next.js application with
            built-in authentication features. It&apos;s designed to be a starting point for any enterprise-level or personal project.
        </p>
    </header>

    <section className="z-10 w-full max-w-3xl flex flex-col items-center text-center space-y-4 mt-10 mb-20">
        <h2 className="text-xl md:text-3xl font-semibold">Why Use This Boilerplate?</h2>
        <p className="text-sm md:text-md">
            Jumpstart your development with pre-built authentication logic, including session management,
            user registration, and login capabilities, all integrated with a modern UI.
        </p>
        <p className="text-sm md:text-md">
            It leverages the best practices in security and scalable architecture, allowing you to focus
            on developing unique features without worrying about the underlying authentication infrastructure.
        </p>
        <p className="text-sm md:text-md">
            You want to own 100% of your user authentication process for security reasons.
        </p>
    </section>
    </main>
  );
}
