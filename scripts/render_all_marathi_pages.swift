import Foundation
import Quartz

let pdfPath = "raw-files/Booth No 157-Marathi.pdf"
guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
    print("Could not open PDF")
    exit(1)
}

let outDir = "/tmp/booth157_pages"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

print("Rendering pages from \(doc.pageCount) total pages...")

// Voter pages are page index 2 to 24 (page 3 to 25)
for p in 2..<min(doc.pageCount - 1, 25) {
    guard let page = doc.page(at: p) else { continue }
    let pageRect = page.bounds(for: .mediaBox)
    let width = Int(pageRect.width)
    let height = Int(pageRect.height)
    
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
    
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
    page.draw(with: .mediaBox, to: ctx)
    
    guard let cgImage = ctx.makeImage() else { continue }
    let outPath = "\(outDir)/page_\(p + 1).jpg"
    let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outPath) as CFURL, "public.jpeg" as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, cgImage, nil)
    CGImageDestinationFinalize(dest)
    print("Rendered Page \(p + 1) -> \(outPath)")
}
print("Done rendering all voter pages!")
