import PasswordlessAuth from '../components/auth/PasswordlessAuth';
import SEO from '../components/seo/SEO';

const RegisterPage = () => {
  return (
    <>
      <SEO title="Create Account | GPSFDK" noindex />
      <PasswordlessAuth isRegister={true} />
    </>
  );
};

export default RegisterPage;
