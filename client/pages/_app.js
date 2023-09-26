import 'bootstrap/dist/css/bootstrap.css'
import buildClient from '../api/build-client';
import Header from '../components/header';

const AppComponent = (
    // These props are generated by the App components getIniitalProps below.
    { Component, pageProps, currentUser }
  ) => {

  // Render the page component Component and send in the props returned from its getInitalProps()
  return (
    <div>
      <Header currentUser={currentUser}/>
      <div className="container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
    </div>
  );
};

// The arguments given to getInitialProps for a page are different to that given to a custom app component
// For a page, there is one context object containing a req and res. context === {req, res}.
// For a customer app component the is one conext object containing context === {Component, ctx: {req,res}}
// When getInitialProps is defined on a customer app component, the getInitialProps on pages are not automatically invoked anymore.
AppComponent.getInitialProps = async (appContext) => {
  // Can't use hooks inside here. Hooks can only be used inside a react component.

  const axiosClient = buildClient(appContext.ctx);
  const { data } = await axiosClient.get('/api/users/currentuser');

  // If the app component has its own getInitalProps, then the getInitalProps on the page
  // compoenents isn't automatically called. So we need to see if it exists and if so, call
  // it manually.
  let pageProps = {};
  // See if the componenent being inserted into app has a getInitalProps defined.
  if(appContext.Component.getInitialProps) {
    // The page being rendered has a getInitialProps defined. So call it.
    // Also give it a prebuilt client so we only do this once and the currentUser
    pageProps = await appContext.Component.getInitialProps(appContext.ctx, axiosClient, data.currentUser);
  }

  // Return data to appear as props in the App component
  return {
    pageProps,  // This is what was returned from the page component getInitialProps
    currentUser: data.currentUser
  };
};

export default AppComponent;
