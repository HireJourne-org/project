import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, PlusCircle, Home, LogOut, UserCircle, FileText, MessageSquare } from 'lucide-react';
import { signOut } from '../services/authService';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <nav className="bg-white text-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/journe-logo.png" alt="Journe" className="h-12" />
            <div className="font-bold text-3xl flex items-center">
              <span className="text-black">Hire</span>
              <div className="flex">
                <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite]">J</span>
                <span className="text-[#CE2028] animate-[textColor_6s_ease-in-out_infinite_2s]">o</span>
                <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite_4s]">u</span>
                <span className="text-[#CE2028] animate-[textColor_6s_ease-in-out_infinite]">r</span>
                <span className="text-[#DCAF35] animate-[textColor_6s_ease-in-out_infinite_2s]">n</span>
                <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite_4s]">e</span>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <NavLink to="/" icon={<Home className="h-5 w-5" />} text="Dashboard" />
              <NavLink to="/questions" icon={<ListChecks className="h-5 w-5" />} text="Questions" />
              <NavLink to="/submissions" icon={<FileText className="h-5 w-5" />} text="Submissions" />
              <NavLink to="/chat" icon={<MessageSquare className="h-5 w-5" />} text="Chat" />
              <NavLink to="/add" icon={<PlusCircle className="h-5 w-5" />} text="Add Question" />
              <NavLink to="/profile" icon={<UserCircle className="h-5 w-5" />} text="Profile" />
            </div>
            
            <div className="h-6 w-px bg-gray-200 mx-2" />
            
            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-1" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, text }) => (
  <Link 
    to={to} 
    className="flex items-center px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-[#164881] transition-colors"
  >
    {icon}
    <span className="ml-1">{text}</span>
  </Link>
);

export default Navbar;