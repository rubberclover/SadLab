package service

import (
  f ".../sadfrontend:component"
  w ".../sadworker:component"
)

#Artifact: {
  ref: name: "sadproject"

  description: {

    //
    // Kumori Component roles and configuration
    //

    // Configuration (parameters and resources) to be provided to the Kumori
    // Service Application.
    config: {
      parameter: {
        language: string
      }
      resource: {}
    }

    // List of Kumori Components of the Kumori Service Application.
    role: {
      sadfrontend: artifact: f.#Artifact
      sadworker: artifact: w.#Artifact
    }

    // Configuration spread:
    // Using the configuration service parameters, spread it into each role
    // parameters
    role: {
      sadfrontend: {
        config: {
          parameter: {}
          resource: {}
        }
      }

      sadworker: {
        config: {
          parameter: {
            appconfig: {
              language: description.config.parameter.language
            }
          }
          resource: {}
        }
      }
    }

    //
    // Kumori Service topology: how roles are interconnected
    //

    // Connectivity of a service application: the set of channels it exposes.
    srv: {
      server: {
        gitservice: { protocol: "http", port: 80 }
      }
    }

    // Connectors, providing specific patterns of communication among channels
    // and specifying the topology graph.
    connect: {
      // Outside -> FrontEnd (LB connector)
      serviceconnector: {
        as: "lb"
  			from: self: "gitservice"
        to: frontend: "restapi": _
      }
      // FrontEnd -> Worker (LB connector)
      evalconnector: {
        as: "lb"
        from: sadfrontend: "evalclient"
        to: sadworker: "evalserver": _
      }
    }

  }
}
