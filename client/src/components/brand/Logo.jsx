import LogoIcon from './LogoIcon';

const Logo = ({ size = 40, showText = true, textSize = 'lg' }) => {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex items-center gap-2.5">
      <LogoIcon size={size} />
      {showText && (
        <div className="leading-tight">
          <h1 className="font-bold text-gray-900 text-balance">
            Jan<span className="text-primary-600">Vaani</span> <span className="text-gray-500 font-medium">AI</span>
          </h1>
          {textSize === 'lg' && (
            <p className="text-xs text-gray-500 hidden sm:block">
              Government Services, In Your Voice
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
