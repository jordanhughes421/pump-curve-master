import Link from "next/link";
import { LineChart, Database, Settings, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between p-6 md:p-24">
      {/* Hero Section */}
      <header className="w-full max-w-5xl flex flex-col items-center text-center space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground">
          Pump Curve Manager
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl">
          Professional tool for managing and analyzing pump performance curves. 
          Create, edit, and visualize pump curves with ease.
        </p>
        <div className="flex gap-4 mt-4">
          <Link 
            href="/curves" 
            className="px-6 py-3 bg-brandColor1 hover:bg-brandColor2 text-foreground rounded-lg transition-colors"
          >
            View Curves
          </Link>
          <Link 
            href="/curves/new" 
            className="px-6 py-3 bg-brandColor3 hover:bg-brandColor4 text-white rounded-lg transition-colors"
          >
            Create New Curve
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="w-full max-w-5xl mt-20">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<LineChart className="w-8 h-8" />}
            title="Interactive Curves"
            description="Create and visualize pump performance curves with our intuitive interface"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8" />}
            title="Data Management"
            description="Store and organize your pump curve data efficiently"
          />
          <FeatureCard
            icon={<Settings className="w-8 h-8" />}
            title="Customizable"
            description="Adjust parameters and settings to match your specific needs"
          />
          <FeatureCard
            icon={<Share2 className="w-8 h-8" />}
            title="Easy Sharing"
            description="Share your pump curves with team members or export for reports"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full max-w-5xl mt-20">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">Why Choose Pump Curve Manager?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-brandColor1/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Professional Grade Tools</h3>
            <p className="text-foreground/80">
              Built with industry standards in mind, providing accurate and reliable pump curve analysis.
            </p>
          </div>
          <div className="p-6 bg-brandColor1/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">User-Friendly Interface</h3>
            <p className="text-foreground/80">
              Intuitive design that makes complex pump curve management simple and efficient.
            </p>
          </div>
          <div className="p-6 bg-brandColor1/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Data Security</h3>
            <p className="text-foreground/80">
              Your pump curve data is securely stored and protected with industry-standard security measures.
            </p>
          </div>
          <div className="p-6 bg-brandColor1/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Regular Updates</h3>
            <p className="text-foreground/80">
              Continuous improvements and new features based on user feedback and industry needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-brandColor1/5 rounded-lg text-center">
      <div className="flex justify-center mb-4 text-brandColor3">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-foreground/80">{description}</p>
    </div>
  );
}
