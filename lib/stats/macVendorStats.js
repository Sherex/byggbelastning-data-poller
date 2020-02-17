const oui = require('oui')

module.exports = (clients) => {
  function parseMacAddress (mac) {
    try {
      return oui(mac).split('\n')[0]
    } catch (error) {
      return 'unknown'
    }
  }

  const clientsPerVendor = {}
  const clientsPerVendorPrime = {}
  const unknownRatio = {
    unknown: 0,
    known: 0
  }
  const primeUnknownRatio = {
    unknown: 0,
    known: 0
  }

  clients.forEach(client => {
    const vendor = parseMacAddress(client.clientMacAddress)
    clientsPerVendor[vendor] ? clientsPerVendor[vendor]++ : clientsPerVendor[vendor] = 1
    clientsPerVendorPrime[client.vendor] ? clientsPerVendorPrime[client.vendor]++ : clientsPerVendorPrime[client.vendor] = 1
    vendor === 'unknown' ? unknownRatio.unknown++ : unknownRatio.known++
    client.vendor === 'Unknown' ? primeUnknownRatio.unknown++ : primeUnknownRatio.known++
  })

  unknownRatio.percentage = parseInt(unknownRatio.unknown / unknownRatio.known * 100) + '%'
  primeUnknownRatio.percentage = parseInt(primeUnknownRatio.unknown / primeUnknownRatio.known * 100) + '%'

  return {
    vendorCountPrime: clientsPerVendorPrime,
    vendorCountOui: clientsPerVendor,
    unknownPercentagePrime: primeUnknownRatio,
    unknownPercentageOui: unknownRatio
  }
}
