import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ className = '', label = 'Back' }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <button 
      onClick={handleBack}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-vy-grey hover:text-vy-white transition-colors ${className}`}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};

export default BackButton;
