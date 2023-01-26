package component

#Artifact: {
  ref: name:  "sadfrontend"

  description: {

    srv: {
      server: {
        restapi: { protocol: "http", port: 3000 }
      }
      client: {
        evalclient: { protocol: "http" }
      }
    }

    config: {
      parameter: {
        appconfig: {
          endpoint: "http://0.evalclient/calc"
        }
      }
      resource: {}
    }

    // Applies to the whole role
    size: {
      bandwidth: { size: 10, unit: "M" }
    }

    probe: frontend: {
      liveness: {
        protocol: http : { port: srv.server.restapi.port, path: "/health" }
        startupGraceWindow: { unit: "ms", duration: 30000, probe: true }
        frequency: "medium"
        timeout: 30000  // msec
      }
      readiness: {
        protocol: http : { port: srv.server.restapi.port, path: "/health" }
        frequency: "medium"
        timeout: 30000 // msec
      }
    }

    code: {

      frontend: {
        name: "sadfrontend"

        image: {
          hub: { name: "", secret: "" }
          tag: "marcado1/sadfrontend"
        }

        mapping: {
          // Filesystem mapping: map the configuration into the JSON file
          // expected by the component
          filesystem: {
            "/config.json": {
              data: value: config.parameter.appconfig
              format: "json"
            }
          }
          env: {
            CONFIG_FILE: value: "/config.json"
            HTTP_SERVER_PORT_ENV: value: "\(srv.server.restapi.port)"
          }
        }

        // Applies to each containr
        size: {
          memory: { size: 100, unit: "M" }
          mincpu: 100
          cpu: { size: 200, unit: "m" }
        }
      }
    }
  }
}
