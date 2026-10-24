import { Eraser } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export interface SignaturePadHandle {
  getDataUrl: () => string | null
  clear: () => void
}

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<SignatureCanvas>(null)

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      const canvas = canvasRef.current
      if (!canvas || canvas.isEmpty()) return null
      // Deliberately not getTrimmedCanvas(): its trim-canvas dependency has a
      // broken CJS/ESM default-export interop under Vite's esbuild
      // pre-bundler ("import_build.default is not a function"). Untrimmed
      // output just has some blank padding around the signature — fine for
      // MVP sign-off.
      return canvas.toDataURL('image/png')
    },
    clear: () => canvasRef.current?.clear(),
  }))

  // Always white, even in dark mode: the pen is black, so it needs a light
  // surface to be visible while signing.
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <SignatureCanvas
        ref={canvasRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: 'block w-full touch-none' }}
      />
      <button
        type="button"
        onClick={() => canvasRef.current?.clear()}
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        <Eraser className="size-3.5" aria-hidden />
        Clear signature
      </button>
    </div>
  )
})
