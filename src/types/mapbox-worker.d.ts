declare module "mapbox-gl/dist/mapbox-gl-csp-worker" {
  const worker: { new (): Worker }
  export default worker
}
