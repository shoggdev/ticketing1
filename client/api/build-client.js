import axios from 'axios';

const buildClient = ({ req }) => {  // Destructure the request from the context object
  // Detect if we are running in the browser
  if(typeof window === 'undefined') {
    // We are on the server
    return axios.create({
      // This is running during the server side rendering. So calls need to go out of the client container
      // via the ingress service. Therefore the route needs to have a domain specified.
      // Th eingress server is in a different namespace. The client pod and other microservices are in the
      // default kubernetes namespace.
      // The format for calling out of the container is http://NAME_OF_TARGET_SERVICE.NAMESPACE_TARGET_IS_IN.svc.cluster.local/path
      // The servcice name can be found via kubectl get namespace and then kubectl get services -n ingress-nginx, when -n specifies the namespace.
      baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      // Send on all headers including Host and auth cookie
      // A Host value is needed because the baseURL won't be recognised by ingress-nginx when it tries to
      // carry out routing. So we need to configure the host name to match the host name specified in the routing rules in
      // the ingress service deplyment config. This Host value is already there in the request headers that we are forwarding.
      headers: req.headers
    });
  } else {
    // We are in the browser
    return axios.create({
      baseURL: '/'
    });
  }
};

export default buildClient;
