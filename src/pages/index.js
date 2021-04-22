import React from "react"

import Layout from "../components/layout"

import Hero from "../components/hero"
import Features from "../components/features"
import Pricing from "../components/pricing"
import CalltoAction from "../components/call-to-action"
import Screenshots from "../components/screenshots"
import Testimonials from "../components/testimonials"
import Subscribe from "../components/subscribe"

import { useSiteMetadata } from "../hooks/use-site-metadata"

export default () => {
  const { sections } = useSiteMetadata()
  const availableSections = {
    "hero": Hero,
    "features": Features,
    "pricing": Pricing,
    "call-to-action": CalltoAction,
    "screenshots": Screenshots,
    "testimonials": Testimonials,
    "subscribe": Subscribe
  }

  return(
    <>
      <Layout>
        {/* Style Guide Section
        ================================================== */}
        <section id="styles"
          style= {{
            padding: '90px 0 72px',
            background: '#fff'
          }}
        >
          <div className="row section-head">
            <h1>Página principal em construção</h1>
            <p className="lead add-bottom">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditipraesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.
            </p>
          </div> {/* Row End*/}

          </section>

      </Layout>
    </>
  )
}
