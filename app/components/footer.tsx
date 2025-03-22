import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-brandColor1 text-brandColor5 p-4 mt-8">
            <div className="container mx-auto flex justify-between items-center flex-wrap">
                <p className="text-sm w-full md:w-auto mb-4 md:mb-0 text-center md:text-left">
                    &copy; {new Date().getFullYear()} Jordan Hughes
                </p>
                <nav className="w-full md:w-auto">
                    <ul className="flex justify-center md:justify-end gap-4 flex-wrap">
                        <li>
                            <Link href="https://github.com/jordanhughes421/pump-curve-master" target="_blank" rel="noopener noreferrer" className="hover:text-brandColor3">
                                GitHub Repository
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
