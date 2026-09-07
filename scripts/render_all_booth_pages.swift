import Foundation
import Quartz

let fm = FileManager.default
let files = try! fm.contentsOfDirectory(atPath: "raw-files")

let booths = [145, 146, 147, 148, 149, 150]

for b in booths {
    guard let mf = files.first(where: { $0.contains("Booth No \(b)") && $0.lowercased().contains("marathi") }) else {
        print("Missing Marathi PDF for Booth \(b)")
        continue
    }
    
    let pdfPath = "raw-files/\(mf)"
    guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else { continue }
    
    let outDir = "/private/tmp/booth_\(b)_pages"
    try? fm.createDirectory(atPath: outDir, withIntermediateDirectories: true)
    
    print("Rendering Booth \(b) (\(doc.pageCount) pages)...")
    
    // Pages 3 to pageCount - 1
    for p in 2..<(doc.pageCount - 1) {
        guard let page = doc.page(at: p) else { continue }
        let pageBounds = page.bounds(for: .mediaBox)
        let width = Int(pageBounds.width)
        let height = Int(pageBounds.height)
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
    }
    print("Rendered Booth \(b) to \(outDir)!")
}
print("All pages rendered successfully!")
