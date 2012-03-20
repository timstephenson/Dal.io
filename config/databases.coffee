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
      name: "app3370426"
      port: 10076
      host: "staff.mongohq.com"
      username: "heroku"
      password: "91de71b9ec1a0b2145c4f78ac9cc35fc"
          
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
