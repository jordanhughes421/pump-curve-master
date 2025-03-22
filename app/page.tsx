import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between p-6 md:p-24">
      <header className="w-full max-w-5xl flex flex-col items-center text-center space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold">Pump Curve Manager</h1>
        <p className="text-md md:text-lg text-brandColor3">
          Professional pump performance analysis and curve management tool
        </p>
      </header>

      <section className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="p-6 bg-brandColor1 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Create Curves</h3>
          <p className="text-sm text-brandColor3">
            Easily create and customize pump performance curves with our intuitive interface
          </p>
        </div>
        <div className="p-6 bg-brandColor1 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Analyze Performance</h3>
          <p className="text-sm text-brandColor3">
            Analyze pump efficiency and performance characteristics with detailed visualizations
          </p>
        </div>
        <div className="p-6 bg-brandColor1 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Compare Pumps</h3>
          <p className="text-sm text-brandColor3">
            Compare multiple pump curves to find the optimal solution for your needs
          </p>
        </div>
      </section>

      <section className="w-full max-w-3xl mt-16 text-center">
        <h2 className="text-xl md:text-3xl font-semibold mb-6">Why Choose Pump Curve Manager?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-left">
            <h3 className="font-semibold mb-2">Professional Grade Tools</h3>
            <p className="text-sm text-brandColor3">
              Built with industry standards in mind, providing accurate and reliable pump curve analysis
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold mb-2">Easy to Use</h3>
            <p className="text-sm text-brandColor3">
              Intuitive interface designed for both beginners and experienced professionals
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold mb-2">Data Visualization</h3>
            <p className="text-sm text-brandColor3">
              Clear and interactive graphs to help you understand pump performance
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold mb-2">Save & Share</h3>
            <p className="text-sm text-brandColor3">
              Store your curves securely and share them with team members
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
