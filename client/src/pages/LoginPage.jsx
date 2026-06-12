import PasswordlessAuth from '../components/auth/PasswordlessAuth';
import SEO from '../components/seo/SEO';

const LoginPage = () => {
  return (
    <>
      <SEO title="Login | GPSFDK" noindex />
      <PasswordlessAuth isRegister={false} />
    </>
  );
};

export default LoginPage;
