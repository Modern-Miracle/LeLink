// /**
//  * @fileoverview FHIR Storage Usage Example
//  * @module lib/fhir-storage/test-example
//  *
//  * Example usage of FHIR Storage server actions and utilities
//  */

// // This file demonstrates how to use the FHIR Storage module
// // It's for documentation purposes and shows the API usage

// import {
//   // Server Actions
//   getCurrentUserResources,
//   getCurrentUserObservations,
//   getPatientResources,
//   checkFHIRStorageHealth,

//   // Types
//   type FHIRStorageResource,
//   type ObservationResource,
//   type ActionResult,

//   // Utilities
//   isObservation,
//   getResourceDisplayName,
//   formatResourceDate,
//   createResourcesSummary,
// } from './index'

// // ===== SERVER ACTION EXAMPLES =====

// /**
//  * Example: Get current user's resources
//  */
// export async function exampleGetUserResources() {
//   const result = await getCurrentUserResources()

//   if (result.success) {
//     console.log(`Found ${result.data?.totalCount} resources`)
//     return result.data
//   } else {
//     console.error('Error:', result.error)
//     return null
//   }
// }

// /**
//  * Example: Get user's observations
//  */
// export async function exampleGetUserObservations() {
//   const result = await getCurrentUserObservations()

//   if (result.success && result.data) {
//     result.data.resources.forEach(obs => {
//       console.log(`Observation: ${obs.code.text}`)
//     })
//     return result.data.resources
//   }

//   return []
// }

// /**
//  * Example: Check service health
//  */
// export async function exampleHealthCheck() {
//   const result = await checkFHIRStorageHealth()

//   if (result.success) {
//     console.log('Service status:', result.data?.status)
//     return result.data
//   }

//   return null
// }

// // ===== UTILITY EXAMPLES =====

// /**
//  * Example: Process resources with utilities
//  */
// export function exampleProcessResources(resources: FHIRStorageResource[]) {
//   // Filter observations
//   const observations = resources.filter(isObservation)

//   // Get display names
//   const displayNames = resources.map(getResourceDisplayName)

//   // Format dates
//   const formattedDates = resources.map(formatResourceDate)

//   // Create summary
//   const summary = createResourcesSummary(resources)

//   return {
//     observations,
//     displayNames,
//     formattedDates,
//     summary,
//   }
// }

// // ===== COMPONENT USAGE EXAMPLES =====

// /**
//  * Example: Server component using FHIR Storage
//  */
// export async function ExampleServerComponent() {
//   const resourcesResult = await getCurrentUserResources()

//   if (!resourcesResult.success) {
//     return <div>Error: {resourcesResult.error}</div>
//   }

//   if (!resourcesResult.data) {
//     return <div>No resources found</div>
//   }

//   const summary = createResourcesSummary(resourcesResult.data.resources)

//   return (
//     <div>
//       <h2>Your Medical Records</h2>
//       <p>Total resources: {resourcesResult.data.totalCount}</p>

//       {summary.map(item => (
//         <div key={item.resourceType}>
//           <h3>{item.resourceType}</h3>
//           <p>Count: {item.count}</p>
//           {item.lastUpdated && (
//             <p>Last updated: {new Date(item.lastUpdated).toLocaleDateString()}</p>
//           )}
//         </div>
//       ))}
//     </div>
//   )
// }

// /**
//  * Example: Type-safe resource processing
//  */
// export function exampleTypeSafeProcessing(resource: FHIRStorageResource) {
//   if (isObservation(resource)) {
//     // TypeScript knows this is an ObservationResource
//     console.log('Observation code:', resource.code.text)
//     console.log('Effective date:', resource.effectiveDateTime)

//     if (resource.valueString) {
//       console.log('Value:', resource.valueString)
//     }

//     if (resource.valueQuantity) {
//       console.log('Quantity:', resource.valueQuantity.value, resource.valueQuantity.unit)
//     }
//   }

//   // Generic processing
//   console.log('Resource type:', resource.resourceType)
//   console.log('Display name:', getResourceDisplayName(resource))
//   console.log('Formatted date:', formatResourceDate(resource))
// }

// export default {
//   exampleGetUserResources,
//   exampleGetUserObservations,
//   exampleHealthCheck,
//   exampleProcessResources,
//   ExampleServerComponent,
//   exampleTypeSafeProcessing,
// }
