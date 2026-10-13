// Sfoca i volti nelle foto (rilevamento con il framework Vision di macOS, tutto in locale).
// Uso:  swift scripts/sfoca-volti.swift [--solo-conta] file1.jpg file2.png …
// Ogni file viene sovrascritto con la versione sfocata; tenere gli originali altrove (es. ../assets).
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = Array(CommandLine.arguments.dropFirst())
let soloConta = args.contains("--solo-conta")
let files = args.filter { !$0.hasPrefix("--") }
let ctx = CIContext()

// Faces are often small in event photos: besides the whole image, look in overlapping tiles
// (2×2 and 3×3, each enlarged by Vision's own scaling) and merge the boxes found.
func detect(_ cg: CGImage) -> [CGRect] {
    let r = VNDetectFaceRectanglesRequest()
    r.revision = VNDetectFaceRectanglesRequestRevision3
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([r])
    return (r.results ?? []).filter { $0.confidence > 0.35 }.map { $0.boundingBox }
}

func iou(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let i = a.intersection(b); if i.isNull { return 0 }
    let ai = i.width * i.height
    return ai / (a.width * a.height + b.width * b.height - ai)
}

func faces(_ cg: CGImage) -> [CGRect] {
    let W = CGFloat(cg.width), H = CGFloat(cg.height)
    var found: [CGRect] = detect(cg)   // normalised, origin bottom-left
    for n in [2, 3, 4] {
        let tw = W / CGFloat(n), th = H / CGFloat(n), ox = tw * 0.25, oy = th * 0.25
        for gy in 0..<n { for gx in 0..<n {
            // tile in pixel coords (CGImage cropping uses top-left origin)
            let px = max(0, CGFloat(gx) * tw - ox), py = max(0, CGFloat(gy) * th - oy)
            let rect = CGRect(x: px, y: py, width: min(W - px, tw + 2 * ox), height: min(H - py, th + 2 * oy)).integral
            guard let tile = cg.cropping(to: rect) else { continue }
            for b in detect(tile) {
                // tile-normalised (bottom-left) -> image-normalised (bottom-left)
                let x = (rect.minX + b.minX * rect.width) / W
                let yTop = rect.minY + (1 - b.maxY) * rect.height          // top edge in pixel, top-left origin
                let y = 1 - (yTop + b.height * rect.height) / H
                found.append(CGRect(x: x, y: y, width: b.width * rect.width / W, height: b.height * rect.height / H))
            }
        } }
    }
    // merge duplicates found at several scales
    var out: [CGRect] = []
    for f in found.sorted(by: { $0.width * $0.height > $1.width * $1.height }) {
        if let k = out.firstIndex(where: { iou($0, f) > 0.25 || $0.contains(CGPoint(x: f.midX, y: f.midY)) }) { out[k] = out[k].union(f) }
        else { out.append(f) }
    }
    return out
}

var totale = 0
for path in files {
    let url = URL(fileURLWithPath: path)
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("! non leggibile: \(path)"); continue }
    let boxes = faces(cg)
    totale += boxes.count
    print(String(format: "%3d volti  %@", boxes.count, (path as NSString).lastPathComponent))
    if soloConta || boxes.isEmpty { continue }

    let W = CGFloat(cg.width), H = CGFloat(cg.height)
    let base = CIImage(cgImage: cg)
    var out = base
    for b in boxes {
        // Vision boxes are normalised with origin bottom-left, like Core Image: enlarge to cover hair and chin
        var r = CGRect(x: b.minX * W, y: b.minY * H, width: b.width * W, height: b.height * H)
        r = r.insetBy(dx: -r.width * 0.35, dy: -r.height * 0.45)
        r = r.intersection(CGRect(x: 0, y: 0, width: W, height: H))
        let radius = max(12, r.width * 0.18)
        let blurred = base.clampedToExtent()
            .applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: max(8, r.width / 9), kCIInputCenterKey: CIVector(x: r.midX, y: r.midY)])
            .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: radius])
            .cropped(to: r)
        // soft-edged oval mask so the blur blends into the photo
        let mask = CIFilter(name: "CIRadialGradient", parameters: [
            "inputCenter": CIVector(x: r.midX, y: r.midY),
            "inputRadius0": min(r.width, r.height) * 0.38,
            "inputRadius1": min(r.width, r.height) * 0.58,
            "inputColor0": CIColor.white, "inputColor1": CIColor(red: 0, green: 0, blue: 0, alpha: 0)
        ])!.outputImage!.cropped(to: r)
        out = blurred.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: out, kCIInputMaskImageKey: mask])
    }
    guard let result = ctx.createCGImage(out.cropped(to: base.extent), from: base.extent) else { print("! errore: \(path)"); continue }
    let type = url.pathExtension.lowercased() == "png" ? UTType.png : UTType.jpeg
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, type.identifier as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, result, [kCGImageDestinationLossyCompressionQuality: 0.84] as CFDictionary)
    CGImageDestinationFinalize(dest)
}
print("totale volti: \(totale)")
