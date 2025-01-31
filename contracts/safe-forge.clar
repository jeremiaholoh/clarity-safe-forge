;; SafeForge Contract System

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-template (err u101))
(define-constant err-template-exists (err u102))

;; Data vars
(define-map templates 
  { template-id: uint } 
  { 
    name: (string-ascii 64),
    version: (string-ascii 32),
    validated: bool,
    created-by: principal,
    timestamp: uint
  }
)

(define-data-var template-counter uint u0)

;; Template Management
(define-public (register-template 
  (name (string-ascii 64))
  (version (string-ascii 32)))
  (let ((template-id (+ (var-get template-counter) u1)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set templates 
          { template-id: template-id }
          { 
            name: name,
            version: version,
            validated: false,
            created-by: tx-sender,
            timestamp: block-height
          }
        )
        (var-set template-counter template-id)
        (ok template-id))
      err-owner-only)))

;; Template Validation
(define-public (validate-template (template-id uint))
  (if (is-eq tx-sender contract-owner)
    (match (map-get? templates {template-id: template-id})
      template (begin
        (map-set templates 
          {template-id: template-id}
          (merge template {validated: true})
        )
        (ok true))
      err-invalid-template)
    err-owner-only))

;; Read-only functions
(define-read-only (get-template (template-id uint))
  (map-get? templates {template-id: template-id}))

(define-read-only (get-template-count)
  (ok (var-get template-counter)))
