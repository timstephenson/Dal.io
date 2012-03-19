module.exports =
  mongodb:
    development:
      name: "dalio-development"
      port: 27017
      host: "127.0.0.1"
    test:
      name: "dalio-test"
      port: 27017
      host: "127.0.0.1"
    staging:
      name: "dalio-staging"
      port: 27017
      host: "127.0.0.1"
    production:
      name: "dalio-production"
      port: 27017
      host: "127.0.0.1"
    
  redis:
    development:
      name: "dalio-development"
      port: 6397
      host: "127.0.0.1"
    test:
      name: "dalio-test"
      port: 6397
      host: "127.0.0.1"
    staging:
      name: "dalio-staging"
      port: 6397
      host: "127.0.0.1"
    production:
      name: "dalio-production"
      port: 6397
      host: "127.0.0.1"
